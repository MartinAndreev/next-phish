export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskColorToken = string;
export type TaskResourceType =
  | "CAMPAIGN"
  | "SCHEDULE"
  | "PAGE"
  | "EMAIL_TEMPLATE"
  | "TARGET_GROUP"
  | "SENDING_PROFILE";

export interface TaskRelationInput {
  type: TaskResourceType;
  id: string;
}

export interface TaskWriteData {
  title: string;
  description?: string;
  statusId: string;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueAt?: string | null;
  relation?: TaskRelationInput | null;
}

export interface TaskStatusWriteData {
  name: string;
  colorToken: TaskColorToken;
  marksTaskDone: boolean;
}

export interface TaskStatusView extends TaskStatusWriteData {
  id: string;
  organizationId: string;
  position: number;
  taskCount?: number;
}

export interface TaskView {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueAt: Date | null;
  completedAt: Date | null;
  isOverdue: boolean;
  statusId: string;
  status: TaskStatusView;
  assignee: { id: string; name: string; email: string } | null;
  relation: {
    type: TaskResourceType;
    id: string;
    name: string;
    href: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
