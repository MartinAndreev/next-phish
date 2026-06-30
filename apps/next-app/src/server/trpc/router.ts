import { router } from "./procedures";
import { userRouter } from "../modules/user/user.router";
import { organizationRouter } from "../modules/organization/organization.router";
import { emailTemplateRouter } from "../modules/email-template/email-template.router";
import { fileRouter } from "../modules/file/file.router";
import { pageRouter } from "../modules/page/page.router";
import { jobRouter } from "../modules/job/job.router";
import { apiKeyRouter } from "../modules/api-key/api-key.router";
import { targetGroupRouter } from "../modules/target-group/target-group.router";

export const appRouter = router({
  user: userRouter,
  organization: organizationRouter,
  emailTemplate: emailTemplateRouter,
  file: fileRouter,
  page: pageRouter,
  job: jobRouter,
  apiKey: apiKeyRouter,
  targetGroup: targetGroupRouter,
});
export type AppRouter = typeof appRouter;
