import type {
  EmailTemplateListItemView,
  EmailTemplateListRow,
  EmailTemplateView,
  EmailTemplateRow,
} from "../types";

export class EmailTemplateService {
  toListItemView(row: EmailTemplateListRow): EmailTemplateListItemView {
    return {
      id: row.id,
      name: row.name,
      tags: row.tags,
      status: row.status,
      organizationId: row.organizationId,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
    };
  }

  toListItemViews(rows: EmailTemplateListRow[]): EmailTemplateListItemView[] {
    return rows.map((row) => this.toListItemView(row));
  }

  toView(row: EmailTemplateRow): EmailTemplateView {
    return {
      ...this.toListItemView(row),
      html: row.html,
      design: row.design,
      trackingPixel: row.trackingPixel,
      fileIds: row.files?.map((f) => f.fileId) ?? [],
    };
  }
}
