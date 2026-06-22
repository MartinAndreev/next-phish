import type { FileView } from "../types";

export class FileService {
  toView(row: FileView): FileView {
    return row;
  }

  toViews(rows: FileView[]): FileView[] {
    return rows.map((row) => this.toView(row));
  }
}
