import type { FileView } from "../types";

export class FileService {
  toView(row: Record<string, unknown>): FileView {
    return {
      id: row.id as string,
      remoteId: row.remoteId as string,
      name: row.name as string,
      size: row.size as number,
      format: row.format as string,
      purpose: row.purpose as FileView["purpose"],
      uploadedById: row.uploadedById as string | null,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    };
  }

  toViews(rows: Record<string, unknown>[]): FileView[] {
    return rows.map((row) => this.toView(row));
  }
}
