import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { EncryptionService } from "../encryption";
import { PageRepository } from "./repositories";
import { PageService } from "./services";
import { GetPagesQuery, GetPageByIdQuery } from "./queries";
import {
  CreatePageCommand,
  UpdatePageCommand,
  DeletePageCommand,
  CreatePageSubmissionCommand,
} from "./commands";

export function registerPageServices(db: PrismaClient): void {
  const pageRepo = new PageRepository(db);
  const pageService = new PageService();
  const encryptionService = Container.get(EncryptionService);

  Container.set(PageRepository, pageRepo);
  Container.set(PageService, pageService);
  Container.set(GetPagesQuery, new GetPagesQuery(pageRepo, pageService));
  Container.set(GetPageByIdQuery, new GetPageByIdQuery(pageRepo, pageService));
  Container.set(
    CreatePageCommand,
    new CreatePageCommand(pageRepo, pageService),
  );
  Container.set(
    UpdatePageCommand,
    new UpdatePageCommand(pageRepo, pageService),
  );
  Container.set(DeletePageCommand, new DeletePageCommand(pageRepo));
  Container.set(
    CreatePageSubmissionCommand,
    new CreatePageSubmissionCommand(pageRepo, encryptionService),
  );
}
