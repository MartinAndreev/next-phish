import { router } from "./procedures";
import { userRouter } from "../modules/user/user.router";
import { organizationRouter } from "../modules/organization/organization.router";
import { emailTemplateRouter } from "../modules/email-template/email-template.router";

export const appRouter = router({
  user: userRouter,
  organization: organizationRouter,
  emailTemplate: emailTemplateRouter,
});

export type AppRouter = typeof appRouter;
