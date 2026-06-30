import { faker } from "@faker-js/faker";
import type { PrismaClient, TargetGroup } from "@prisma/client";
import { Factory } from "./factory";

interface TargetGroupCreateData {
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  organizationId: string;
  createdById: string;
}

export class TargetGroupFactory extends Factory<
  TargetGroupCreateData,
  TargetGroup
> {
  constructor(prisma: PrismaClient) {
    super((data) => prisma.targetGroup.create({ data }));
  }

  getShape(): TargetGroupCreateData {
    return {
      name: faker.company.name() + " Targets",
      status: "DRAFT",
      organizationId: "",
      createdById: "",
    };
  }
}
