import type { EmailTemplateListItemView, EmailTemplateView } from "../types";

export class EmailTemplateService {
  toListItemView(row: EmailTemplateListItemView): EmailTemplateListItemView {
    return row;
  }

  toListItemViews(
    rows: EmailTemplateListItemView[],
  ): EmailTemplateListItemView[] {
    return rows;
  }

  toView(row: EmailTemplateView): EmailTemplateView {
    return row;
  }
}
