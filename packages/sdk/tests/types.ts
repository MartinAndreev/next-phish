import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../apps/next-app/src/server/trpc/router";
import {
  createNextPhishClient,
  type ApiInputs,
  type ApiOutputs,
} from "../dist/index.js";

type Inputs = inferRouterInputs<AppRouter>;
type Outputs = inferRouterOutputs<AppRouter>;
type SelectedInputs = {
  [K in keyof ApiInputs]: Pick<Inputs[K], keyof ApiInputs[K] & keyof Inputs[K]>;
};
type SelectedOutputs = {
  [K in keyof ApiOutputs]: Pick<
    Outputs[K],
    keyof ApiOutputs[K] & keyof Outputs[K]
  >;
};
type Assert<T extends true> = T;
// Every exported input/output must stay assignable in both directions, including
// optional inputs, dates, enums, and recursive Prisma JSON values.
export type ContractChecks = [
  Assert<ApiInputs extends SelectedInputs ? true : false>,
  Assert<SelectedInputs extends ApiInputs ? true : false>,
  Assert<ApiOutputs extends SelectedOutputs ? true : false>,
  Assert<SelectedOutputs extends ApiOutputs ? true : false>,
];

const client = createNextPhishClient({
  baseUrl: "https://example.com",
  token: "pat",
});
void client.campaign.list.query({ organizationId: "org" });
void client.campaign.setDeliveryEnabled.mutate({
  organizationId: "org",
  campaignId: "campaign",
  deliveryEnabled: true,
});
// @ts-expect-error Required mutation fields must be supplied.
void client.campaign.setDeliveryEnabled.mutate({ organizationId: "org" });
// @ts-expect-error Queries cannot be called as mutations.
void client.campaign.list.mutate({ organizationId: "org" });
// @ts-expect-error Admin APIs are not part of the PAT SDK.
void client.user.list.query();
// @ts-expect-error Subscriptions are not part of this HTTP SDK.
void client.targetGroup.onImportProgress.subscribe({ jobId: "job" });
