import { Container } from "typedi";
import type { PrismaClient } from "@prisma/client";
import { EmailTemplateRepository } from "./repositories";
import { EmailTemplateService } from "./services";
import { GetEmailTemplatesQuery, GetEmailTemplateByIdQuery } from "./queries";
import {
  CreateEmailTemplateCommand,
  UpdateEmailTemplateCommand,
  DeleteEmailTemplateCommand,
} from "./commands";

export function registerEmailTemplateServices(db: PrismaClient): void {
  const emailTemplateRepo = new EmailTemplateRepository(db);
  const emailTemplateService = new EmailTemplateService();

  Container.set(EmailTemplateRepository, emailTemplateRepo);
  Container.set(EmailTemplateService, emailTemplateService);
  Container.set(
    GetEmailTemplatesQuery,
    new GetEmailTemplatesQuery(emailTemplateRepo, emailTemplateService),
  );
  Container.set(
    GetEmailTemplateByIdQuery,
    new GetEmailTemplateByIdQuery(emailTemplateRepo, emailTemplateService),
  );
  Container.set(
    CreateEmailTemplateCommand,
    new CreateEmailTemplateCommand(emailTemplateRepo, emailTemplateService),
  );
  Container.set(
    UpdateEmailTemplateCommand,
    new UpdateEmailTemplateCommand(emailTemplateRepo, emailTemplateService),
  );
  Container.set(
    DeleteEmailTemplateCommand,
    new DeleteEmailTemplateCommand(emailTemplateRepo),
  );
}
