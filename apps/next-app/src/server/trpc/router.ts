import { router } from "./procedures";
import { userRouter } from "../modules/user/user.router";
import { organizationRouter } from "../modules/organization/organization.router";
import { emailTemplateRouter } from "../modules/email-template/email-template.router";
import { fileRouter } from "../modules/file/file.router";

export const appRouter = router({
  user: userRouter,
  organization: organizationRouter,
  emailTemplate: emailTemplateRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
