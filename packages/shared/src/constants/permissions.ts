export interface PermissionGroup {
  resource: string;
  read: string;
  write: string | null;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    resource: "organizations",
    read: "read:organizations",
    write: "write:organizations",
  },
  {
    resource: "email-templates",
    read: "read:email-templates",
    write: "write:email-templates",
  },
  { resource: "pages", read: "read:pages", write: "write:pages" },
  { resource: "files", read: "read:files", write: "write:files" },
  { resource: "jobs", read: "read:jobs", write: null },
  {
    resource: "target-groups",
    read: "read:target-groups",
    write: "write:target-groups",
  },
  {
    resource: "mail-sending",
    read: "read:mail-sending",
    write: "write:mail-sending",
  },
  {
    resource: "campaigns",
    read: "read:campaigns",
    write: "write:campaigns",
  },
  { resource: "tasks", read: "read:tasks", write: "write:tasks" },
  {
    resource: "task-statuses",
    read: "read:task-statuses",
    write: "write:task-statuses",
  },
];

export type PermissionResource = (typeof PERMISSION_GROUPS)[number]["resource"];

export function toBetterAuthStatements(): Record<string, string[]> {
  const statements: Record<string, string[]> = {};
  for (const group of PERMISSION_GROUPS) {
    const actions: string[] = ["read"];
    if (group.write) {
      actions.push("write");
    }
    statements[group.resource] = actions;
  }
  return statements;
}

export function toRouterPermissions(
  resource: PermissionResource,
  action: "read" | "write",
): Record<string, string[]> {
  return { [resource]: [action] };
}
