import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { OrganizationRepository } from "./repositories";
import { OrganizationService } from "./services";
import { GetUserOrganizationsQuery } from "./queries";
import { CreateOrganizationCommand } from "./commands";

interface AuthApi {
  createOrganization: (opts: {
    body: { name: string; slug: string };
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
}

export function registerOrganizationAuth(auth: { api: AuthApi }): void {
  Container.set(CreateOrganizationCommand, new CreateOrganizationCommand(auth));
}
