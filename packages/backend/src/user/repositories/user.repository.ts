import type { PrismaClient } from "@next-phish/database";
import type { CreateUserData, UserView } from "../types";

const userViewSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  createdAt: true,
} as const;

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<UserView | null> {
    return this.db.user.findUnique({
      where: { id },
      select: userViewSelect,
    });
  }

  async findByEmail(email: string): Promise<UserView | null> {
    return this.db.user.findUnique({
      where: { email },
      select: userViewSelect,
    });
  }

  async count(): Promise<number> {
    return this.db.user.count();
  }

  async create(data: CreateUserData & { id: string }): Promise<UserView> {
    return this.db.user.create({
      data,
      select: userViewSelect,
    });
  }
}
