import type { ICommandHandler } from "../../message-bus";
import type { JobRepository } from "../../job";
import { TargetGroupRepository } from "../repositories";

interface ImportTargetGroupUsersInput {
  jobId: string;
}

interface ImportProgress {
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
  validationErrors: Array<{ row: number; field: string; message: string }>;
}

interface ParsedRow {
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
}

const BATCH_SIZE = 500;

export class ImportTargetGroupUsersCommand implements ICommandHandler<
  ImportTargetGroupUsersInput,
  void
> {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly targetGroupRepo: TargetGroupRepository,
  ) {}

  async execute({ jobId }: ImportTargetGroupUsersInput): Promise<void> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new Error("Job not found");

    const input = job.input as {
      targetGroupId: string;
      mode: "insert" | "upsert";
      file: string;
      fileName: string;
    };

    await this.jobRepo.update(jobId, {
      status: "RUNNING",
      startedAt: new Date(),
    });

    try {
      const XLSX = (await import("xlsx")) as typeof import("xlsx");
      const buffer = Buffer.from(input.file, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("No sheet found in file");

      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet!);

      const { rows, validationErrors } = this.validateRows(rawData);

      if (rows.length === 0) {
        await this.jobRepo.update(jobId, {
          status: "COMPLETED",
          progress: {
            total: 0,
            processed: 0,
            inserted: 0,
            updated: 0,
            errors: validationErrors.length,
            currentBatch: 0,
            totalBatches: 0,
            validationErrors,
          } satisfies ImportProgress,
          completedAt: new Date(),
        });
        return;
      }

      const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
      const progress: ImportProgress = {
        total: rows.length,
        processed: 0,
        inserted: 0,
        updated: 0,
        errors: validationErrors.length,
        currentBatch: 0,
        totalBatches,
        validationErrors,
      };

      await this.jobRepo.update(jobId, { progress });

      if (input.mode === "upsert") {
        const emails = rows.map((r) => r.email);
        const existingMap = await this.targetGroupRepo.loadUsersByEmailMap(
          input.targetGroupId,
          emails,
        );

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          progress.currentBatch = Math.floor(i / BATCH_SIZE) + 1;

          const newUsers = batch.filter((r) => !existingMap.has(r.email));
          const existingUsers = batch.filter((r) => existingMap.has(r.email));

          if (newUsers.length > 0) {
            const count = await this.targetGroupRepo.insertUsers(
              input.targetGroupId,
              newUsers,
            );
            progress.inserted += count;
          }

          for (const user of existingUsers) {
            await this.targetGroupRepo.upsertUsers(input.targetGroupId, [user]);
            progress.updated++;
          }

          progress.processed = batch.length;
          await this.jobRepo.update(jobId, { progress });
        }
      } else {
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          progress.currentBatch = Math.floor(i / BATCH_SIZE) + 1;

          const count = await this.targetGroupRepo.insertUsers(
            input.targetGroupId,
            batch,
          );
          progress.inserted += count;
          progress.processed = i + batch.length;

          await this.jobRepo.update(jobId, { progress });
        }
      }

      await this.jobRepo.update(jobId, {
        status: "COMPLETED",
        completedAt: new Date(),
      });
    } catch (error) {
      await this.jobRepo.update(jobId, {
        status: "FAILED",
        output: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private validateRows(rawData: Record<string, unknown>[]): {
    rows: ParsedRow[];
    validationErrors: ImportProgress["validationErrors"];
  } {
    const rows: ParsedRow[] = [];
    const validationErrors: ImportProgress["validationErrors"] = [];

    const columnMap: Record<string, string> = {};
    const aliases: Record<string, string[]> = {
      email: ["email", "e-mail", "e_mail", "mail"],
      firstName: ["firstname", "first_name", "first name", "fname", "name"],
      lastName: ["lastname", "last_name", "last name", "lname", "surname"],
      position: ["position", "title", "job_title", "jobtitle", "role"],
    };

    if (rawData.length > 0) {
      const firstRow = rawData[0];
      if (firstRow) {
        const keys = Object.keys(firstRow);
        for (const key of keys) {
          const normalized = key
            .toLowerCase()
            .trim()
            .replace(/[\s_-]+/g, "");
          for (const [field, fieldAliases] of Object.entries(aliases)) {
            if (
              fieldAliases.some((a) => a.replace(/[\s_-]+/g, "") === normalized)
            ) {
              columnMap[key] = field;
              break;
            }
          }
        }
      }
    }

    for (let i = 0; i < rawData.length; i++) {
      const raw = rawData[i];
      if (!raw) continue;
      const rowNum = i + 2;

      const emailKey = Object.keys(columnMap).find(
        (k) => columnMap[k] === "email",
      );
      const firstNameKey = Object.keys(columnMap).find(
        (k) => columnMap[k] === "firstName",
      );
      const lastNameKey = Object.keys(columnMap).find(
        (k) => columnMap[k] === "lastName",
      );
      const positionKey = Object.keys(columnMap).find(
        (k) => columnMap[k] === "position",
      );

      const email = emailKey ? String(raw[emailKey] ?? "").trim() : "";
      const firstName = firstNameKey
        ? String(raw[firstNameKey] ?? "").trim()
        : "";
      const lastName = lastNameKey ? String(raw[lastNameKey] ?? "").trim() : "";
      const position = positionKey
        ? String(raw[positionKey] ?? "").trim()
        : undefined;

      let hasError = false;

      if (!email) {
        validationErrors.push({
          row: rowNum,
          field: "email",
          message: "Email is required",
        });
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        validationErrors.push({
          row: rowNum,
          field: "email",
          message: "Invalid email format",
        });
        hasError = true;
      }

      if (!firstName) {
        validationErrors.push({
          row: rowNum,
          field: "firstName",
          message: "First name is required",
        });
        hasError = true;
      }

      if (!lastName) {
        validationErrors.push({
          row: rowNum,
          field: "lastName",
          message: "Last name is required",
        });
        hasError = true;
      }

      if (!hasError) {
        rows.push({ email, firstName, lastName, position });
      }
    }

    return { rows, validationErrors };
  }
}
