import { faker } from "@faker-js/faker";
import type { PrismaClient, User } from "@prisma/client";
import { Factory } from "./factory";

export class UserFactory extends Factory<
  Parameters<PrismaClient["user"]["create"]>[0]["data"],
  User
> {
  constructor(prisma: PrismaClient) {
    super((data) => prisma.user.create({ data }));
  }

  getShape() {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    };
  }
}
