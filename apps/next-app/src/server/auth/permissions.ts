import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { toBetterAuthStatements } from "@next-phish/shared";

const customStatements = toBetterAuthStatements();

const statement = {
  ...defaultStatements,
  ...customStatements,
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  organizations: ["read", "write"],
  "email-templates": ["read", "write"],
  pages: ["read", "write"],
  files: ["read", "write"],
  jobs: ["read"],
  campaigns: ["read", "write"],
} as unknown as Parameters<typeof ac.newRole>[0]);

export const admin = ac.newRole({
  ...adminAc.statements,
  organizations: ["read", "write"],
  "email-templates": ["read", "write"],
  pages: ["read", "write"],
  files: ["read", "write"],
  jobs: ["read"],
  campaigns: ["read", "write"],
} as unknown as Parameters<typeof ac.newRole>[0]);

export const member = ac.newRole({
  ...memberAc.statements,
  organizations: ["read"],
  "email-templates": ["read"],
  pages: ["read"],
  files: ["read"],
  jobs: ["read"],
  campaigns: ["read"],
} as unknown as Parameters<typeof ac.newRole>[0]);
