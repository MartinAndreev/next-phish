import { beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { DeliveryRepository } from "../../src/delivery";
import { getFactories, getPrisma } from "../setup";

describe("global and organization ignored networks", () => {
  let db: PrismaClient;
  let repository: DeliveryRepository;

  beforeAll(() => {
    db = getPrisma();
    repository = new DeliveryRepository(db);
  });

  it("reuses the ignored network table while keeping global and organization scopes separate", async () => {
    const actor = await getFactories().user.createOne();
    const organization = await getFactories().organization.createOne();

    await repository.createIgnoredNetwork({
      organizationId: null,
      createdById: actor.id,
      network: "192.0.2.0/24",
      normalizedNetwork: "192.0.2.0/24",
      description: "Global gateway",
    });
    await repository.createIgnoredNetwork({
      organizationId: organization.id,
      createdById: actor.id,
      network: "192.0.2.0/24",
      normalizedNetwork: "192.0.2.0/24",
      description: "Organization gateway",
    });

    expect(await repository.listIgnoredNetworks(null)).toHaveLength(1);
    expect(await repository.listIgnoredNetworks(organization.id)).toHaveLength(
      1,
    );
    expect(await db.ignoredNetwork.count()).toBe(2);
  });
});
