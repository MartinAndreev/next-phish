import { faker } from "@faker-js/faker";
import type { PrismaClient, Organization } from "@prisma/client";
import { Factory } from "./factory";

export class OrganizationFactory extends Factory<
  Parameters<PrismaClient["organization"]["create"]>[0]["data"],
  Organization
> {
  constructor(prisma: PrismaClient) {
    super((data) => prisma.organization.create({ data }));
  }

  getShape() {
    const name = faker.company.name();
    return {
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
    };
  }
}
