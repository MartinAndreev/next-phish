import type {
  TargetGroupListItemView,
  TargetGroupView,
  TargetGroupUserView,
} from "../types";

export class TargetGroupService {
  toListItemView(row: TargetGroupListItemView): TargetGroupListItemView {
    return row;
  }

  toListItemViews(rows: TargetGroupListItemView[]): TargetGroupListItemView[] {
    return rows;
  }

  toView(row: TargetGroupView): TargetGroupView {
    return row;
  }

  toUserView(row: TargetGroupUserView): TargetGroupUserView {
    return row;
  }

  toUserViews(rows: TargetGroupUserView[]): TargetGroupUserView[] {
    return rows;
  }
}
