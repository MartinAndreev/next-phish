import type { PageListItemView, PageView } from "../types";

export class PageService {
  toListItemView(row: PageListItemView): PageListItemView {
    return row;
  }

  toListItemViews(rows: PageListItemView[]): PageListItemView[] {
    return rows;
  }

  toView(row: PageView): PageView {
    return row;
  }
}
