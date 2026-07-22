import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { OrganizationRepository } from "./repositories";
import { OrganizationService } from "./services";
import {
  GetUserOrganizationsQuery,
  GetOrganizationByIdQuery,
  GetOrganizationMembersQuery,
  GetOrganizationAnalyticsQuery,
  GetOrganizationDashboardQuery,
} from "./queries";
import {
  CreateOrganizationCommand,
  DeleteOrganizationCommand,
  UpdateOrganizationCommand,
} from "./commands";

interface AuthApi {
  createOrganization: (opts: {
    body: { name: string; slug: string };
    headers: Headers;
  }) => Promise<unknown>;
  deleteOrganization: (opts: {
    body: { organizationId: string };
    headers: Headers;
  }) => Promise<unknown>;
}

export function registerOrganizationServices(db: PrismaClient): void {
  const orgRepo = new OrganizationRepository(db);
  const orgService = new OrganizationService();

  Container.set(OrganizationRepository, orgRepo);
  Container.set(OrganizationService, orgService);
  Container.set(
    GetUserOrganizationsQuery,
    new GetUserOrganizationsQuery(orgRepo, orgService),
  );
  Container.set(
    GetOrganizationByIdQuery,
    new GetOrganizationByIdQuery(orgRepo, orgService),
  );
  Container.set(
    GetOrganizationMembersQuery,
    new GetOrganizationMembersQuery(orgRepo),
  );
  Container.set(
    GetOrganizationAnalyticsQuery,
    new GetOrganizationAnalyticsQuery(orgRepo),
  );
  Container.set(
    GetOrganizationDashboardQuery,
    new GetOrganizationDashboardQuery(orgRepo),
  );
  Container.set(
    UpdateOrganizationCommand,
    new UpdateOrganizationCommand(orgRepo, orgService),
  );
}

export function registerOrganizationAuth(auth: { api: AuthApi }): void {
  Container.set(CreateOrganizationCommand, new CreateOrganizationCommand(auth));
  Container.set(DeleteOrganizationCommand, new DeleteOrganizationCommand(auth));
}
