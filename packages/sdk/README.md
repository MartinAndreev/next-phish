# Next Phish Node.js SDK

Typed tRPC client for the Next Phish personal access token (PAT) APIs. Requires Node.js 22+ and ESM (`import`).

```sh
npm install @next-phish/sdk
```

```js
import { createNextPhishClient } from "@next-phish/sdk";

const client = createNextPhishClient({
  baseUrl: process.env.NEXT_PHISH_URL, // e.g. https://phish.example.com
  token: process.env.NEXT_PHISH_PAT,
});

const campaigns = await client.campaign.list.query({
  organizationId: process.env.NEXT_PHISH_ORGANIZATION_ID,
});

await client.campaign.setDeliveryEnabled.mutate({
  organizationId: process.env.NEXT_PHISH_ORGANIZATION_ID,
  campaignId: "campaign-id",
  deliveryEnabled: false,
});
```

Use the instance URL as `baseUrl`, including any deployment base path but without `/api/trpc`. The SDK appends that endpoint and sends the token as `x-api-key`. An optional `fetch` function can be supplied for custom transport behavior.

Create a PAT in Next Phish with the required read/write permissions and organization access. Supply `organizationId` on organization-scoped calls: a PAT has no browser session's active organization. The token owner must also be a member of the organization. Permissions, expiry, revocation, and rate limits are enforced by the server.

Available namespaces: `organization`, `emailTemplate`, `file`, `page`, `job`, `targetGroup`, `mailSending`, `campaign`, and `task`. Use `.query(input)` for reads and `.mutate(input)` for writes; editor autocomplete shows each procedure's fields. Admin, session, PAT-management, and subscription APIs are excluded. Poll `job.getById.query({ organizationId, id: jobId })` for import progress.

Requests are batched with tRPC's HTTP batch link and use SuperJSON, so `Date` values round-trip as dates. Calls accept standard tRPC request options such as `{ signal }` as a second argument. Errors are standard `TRPCClientError` instances; the SDK does not retry failed writes automatically.

```ts
import {
  TRPCClientError,
  type ApiInputs,
  type ApiOutputs,
} from "@next-phish/sdk";

type ListCampaignsInput = ApiInputs["campaign"]["list"];
type ListCampaignsOutput = ApiOutputs["campaign"]["list"];

try {
  await client.campaign.list.query({ organizationId: "org-id" });
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.error(error.message, error.data?.code);
  }
  throw error;
}
```

## Development

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @next-phish/sdk test
pnpm --filter @next-phish/sdk lint
pnpm --filter @next-phish/sdk test:package
```

The build reads the application router with the TypeScript compiler and generates a standalone data contract. It never executes the server or connects to a database. Generated source and `dist/` are ignored by Git. Published declarations reference only public tRPC types, with no imports from Next.js, Prisma, or private workspace packages. Contract tests compare every exposed input/output against the real router in both directions. Keep the SDK version compatible with the deployed server; API changes require a new SDK release.

## Publishing

The workflow `.github/workflows/publish-sdk.yml` publishes stable versions to npm when a matching `sdk-vX.Y.Z` tag is pushed. It verifies the version, generates Prisma types, lints, builds, tests, packs, and publishes the SDK.

One-time setup:

1. Ensure you own the `@next-phish` npm scope and bootstrap `@next-phish/sdk` with an authenticated first publish if the package does not exist yet. Build and test first, then run `npm publish --access public --ignore-scripts` from `packages/sdk`.
2. Create a GitHub environment named `npm`, with any desired release approval/tag rules.
3. In the npm package's **Settings → Trusted publishing**, configure GitHub Actions: owner `MartinAndreev`, repository `next-phish`, workflow `publish-sdk.yml`, environment `npm`, with publishing allowed. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). The workflow uses OIDC and automatic provenance; no npm token secret is needed.

For each release, update `packages/sdk/package.json`'s version, run the checks, commit the changes, and create the matching `sdk-vX.Y.Z` tag. Push the commit and tag when ready to publish. Existing npm versions cannot be overwritten. Prerelease versions are intentionally rejected by this workflow.
