import assert from "node:assert/strict";
import { test } from "node:test";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createNextPhishClient, TRPCClientError } from "../dist/index.js";

const date = new Date("2026-09-01T12:00:00.000Z");
const t = initTRPC.create({ transformer: superjson });
const procedure = t.procedure
  .use(({ ctx, next }) => {
    if (ctx.token !== "test-pat") throw new TRPCError({ code: "UNAUTHORIZED" });
    return next();
  })
  .input((input) => input);
const router = t.router({
  campaign: t.router({
    list: procedure.query(({ input }) => ({ input, createdAt: date })),
    setDeliveryEnabled: procedure.mutation(({ input }) => input),
  }),
});

function setup(token = "test-pat") {
  const requests = [];
  const client = createNextPhishClient({
    baseUrl: "https://next-phish.example/prefix/",
    token,
    fetch: async (url, init) => {
      const req = new Request(url, init);
      requests.push(req);
      return fetchRequestHandler({
        endpoint: "/prefix/api/trpc",
        req,
        router,
        createContext: () => ({ token: req.headers.get("x-api-key") }),
      });
    },
  });
  return { client, requests };
}

test("batches queries with PAT authentication and preserves organization inputs and dates", async () => {
  const { client, requests } = setup();
  const [first, second] = await Promise.all([
    client.campaign.list.query({ organizationId: "org-1" }),
    client.campaign.list.query({ organizationId: "org-2" }),
  ]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[0].headers.get("x-api-key"), "test-pat");
  assert.equal(
    new URL(requests[0].url).pathname,
    "/prefix/api/trpc/campaign.list,campaign.list",
  );
  assert.deepEqual(first, {
    input: { organizationId: "org-1" },
    createdAt: date,
  });
  assert.equal(second.input.organizationId, "org-2");
});

test("sends mutations as POST and serializes their inputs", async () => {
  const { client, requests } = setup();
  const input = {
    organizationId: "org",
    campaignId: "campaign",
    deliveryEnabled: false,
  };
  assert.deepEqual(
    await client.campaign.setDeliveryEnabled.mutate(input),
    input,
  );
  assert.equal(requests[0].method, "POST");
});

test("preserves structured tRPC authentication errors", async () => {
  const { client } = setup("invalid-pat");
  await assert.rejects(
    client.campaign.list.query({ organizationId: "org" }),
    (error) => {
      assert.ok(error instanceof TRPCClientError);
      assert.equal(error.data.code, "UNAUTHORIZED");
      return true;
    },
  );
});

test("rejects invalid configuration before making a request", () => {
  for (const baseUrl of [
    "bad",
    "ftp://example.com",
    "https://user:pass@example.com",
    "https://example.com?foo=bar",
    "https://example.com#hash",
  ]) {
    assert.throws(
      () => createNextPhishClient({ baseUrl, token: "pat" }),
      TypeError,
    );
  }
  for (const token of ["", "   ", "pat\r\nx-other: value"]) {
    assert.throws(
      () => createNextPhishClient({ baseUrl: "https://example.com", token }),
      TypeError,
    );
  }
});
