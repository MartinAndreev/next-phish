import type { ICommandHandler } from "../../message-bus";
import type { JobRepository } from "../../job";
import { FileRepository } from "../../file/repositories";
import { R2Client } from "../../storage/r2-client";
import { TargetGroupRepository } from "../repositories";
import { readSpreadsheet } from "../services/spreadsheet-reader.service";
import type { ValidationError } from "../services/spreadsheet-reader.service";

interface ImportTargetGroupUsersInput {
  jobId: string;
}

interface ImportProgress {
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
  validationErrors: ValidationError[];
}

const BATCH_SIZE = 500;

export class ImportTargetGroupUsersCommand implements ICommandHandler<
  ImportTargetGroupUsersInput,
  void
> {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly targetGroupRepo: TargetGroupRepository,
    private readonly fileRepo: FileRepository,
    private readonly r2: R2Client,
  ) {}

  async execute({ jobId }: ImportTargetGroupUsersInput): Promise<void> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new Error("Job not found");

    const input = job.input as {
      targetGroupId: string;
      mode: "insert" | "upsert";
      fileId: string;
      fileName: string;
    };

    await this.jobRepo.update(jobId, {
      status: "RUNNING",
      startedAt: new Date(),
    });

    try {
      const file = await this.fileRepo.findById(input.fileId);
      if (!file) throw new Error("File not found");

      const fileData = await this.r2.getObject(file.remoteId);
      if (!fileData) throw new Error("Failed to download file from storage");

      const { rows, validationErrors } = await readSpreadsheet(fileData.body);

      if (rows.length === 0) {
        await this.jobRepo.update(jobId, {
          status: "COMPLETED",
          progress: {
            total: 0,
            processed: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
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
        skipped: 0,
        errors: validationErrors.length,
        currentBatch: 0,
        totalBatches,
        validationErrors,
      };

      await this.jobRepo.update(jobId, { progress });

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

        if (input.mode === "upsert") {
          for (const user of existingUsers) {
            await this.targetGroupRepo.upsertUsers(input.targetGroupId, [user]);
            progress.updated++;
          }
        } else {
          progress.skipped += existingUsers.length;
        }

        progress.processed += batch.length;
        await this.jobRepo.update(jobId, { progress });
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
}
