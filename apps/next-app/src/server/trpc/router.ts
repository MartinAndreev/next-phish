import { router } from "./procedures";
import { userRouter } from "../modules/user/user.router";
import { organizationRouter } from "../modules/organization/organization.router";

export const appRouter = router({
  user: userRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
