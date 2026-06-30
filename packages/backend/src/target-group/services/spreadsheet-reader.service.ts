import { z } from "zod";

const FIELD_MAP: Record<string, string> = {
  email: "email",
  firstname: "firstName",
  lastname: "lastName",
  position: "position",
};

const rowSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  position: z.string().optional(),
});

export type ParsedRow = z.infer<typeof rowSchema>;

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ReadResult {
  rows: ParsedRow[];
  validationErrors: ValidationError[];
}

function normalizeFieldName(name: string): string {
  return name.toLowerCase().trim();
}

function buildColumnMap(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const header of headers) {
    const normalized = normalizeFieldName(header);
    const schemaField = FIELD_MAP[normalized];
    if (schemaField) {
      map.set(header, schemaField);
    }
  }

  return map;
}

function parseRow(
  raw: Record<string, unknown>,
  columnMap: Map<string, string>,
  rowNum: number,
): { row: ParsedRow | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const mapped: Record<string, unknown> = {};

  for (const [original, schemaField] of columnMap) {
    mapped[schemaField] = raw[original];
  }

  const result = rowSchema.safeParse({
    email: String(mapped.email ?? "").trim(),
    firstName: String(mapped.firstName ?? "").trim(),
    lastName: String(mapped.lastName ?? "").trim(),
    position: mapped.position ? String(mapped.position).trim() : undefined,
  });

  if (result.success) {
    return { row: result.data, errors: [] };
  }

  for (const issue of result.error.issues) {
    errors.push({
      row: rowNum,
      field: issue.path.join("."),
      message: issue.message,
    });
  }

  return { row: null, errors };
}

export async function* readSpreadsheetRows(
  buffer: Buffer,
): AsyncGenerator<
  { type: "row"; data: ParsedRow } | { type: "error"; data: ValidationError }
> {
  const XLSX = (await import("xlsx")) as typeof import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return;

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet!);

  if (rawData.length === 0) return;

  const headers = Object.keys(rawData[0]!);
  const columnMap = buildColumnMap(headers);

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i]!;
    const rowNum = i + 2;
    const { row, errors } = parseRow(raw, columnMap, rowNum);

    for (const error of errors) {
      yield { type: "error", data: error };
    }

    if (row) {
      yield { type: "row", data: row };
    }
  }
}

export async function readSpreadsheet(buffer: Buffer): Promise<ReadResult> {
  const rows: ParsedRow[] = [];
  const validationErrors: ValidationError[] = [];

  for await (const item of readSpreadsheetRows(buffer)) {
    if (item.type === "row") {
      rows.push(item.data);
    } else {
      validationErrors.push(item.data);
    }
  }

  return { rows, validationErrors };
}
