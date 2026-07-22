export type SystemUserRole = "admin" | "user";
export type UserOrganizationMode = "existing" | "self";
export type OrphanUserAction = "keep" | "delete";

export interface CreateUserData {
  name: string;
  email: string;
  role: SystemUserRole;
  organizationMode: UserOrganizationMode;
  organizationId?: string;
}

export interface UserOrganizationView {
  id: string;
  name: string;
  role: string;
}

export interface UserView {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  passwordSetupRequired: boolean;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organizations: UserOrganizationView[];
  ownedOrganizationCount: number;
}

export interface UserDeletionPreview {
  userId: string;
  ownedOrganizations: Array<{ id: string; name: string }>;
  orphanedUsers: Array<{ id: string; name: string; email: string }>;
  hasActiveData: boolean;
}

export interface WelcomeUserJob {
  userId: string;
  name: string;
  email: string;
  magicLink: string;
}
