export type TargetGroupStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface TargetGroupUserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string | null;
}

export interface TargetGroupAuthorView {
  id: string;
  name: string;
  email: string;
}

export interface TargetGroupListItemView {
  id: string;
  name: string;
  status: TargetGroupStatus;
  organizationId: string;
  createdById: string;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: TargetGroupAuthorView;
}

export interface TargetGroupView extends TargetGroupListItemView {
  users: TargetGroupUserView[];
}

export interface CreateTargetGroupData {
  name: string;
  status: TargetGroupStatus;
  organizationId: string;
  createdById: string;
  users?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    position?: string;
  }>;
}

export interface UpdateTargetGroupData {
  name: string;
  status: TargetGroupStatus;
}
