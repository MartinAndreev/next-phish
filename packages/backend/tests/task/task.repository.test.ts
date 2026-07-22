import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { TaskRepository } from "../../src/task";
import { getFactories, getPrisma } from "../setup";

describe("TaskRepository", () => {
  let db: PrismaClient;
  let repo: TaskRepository;
  let organizationId: string;
  let userId: string;

  beforeAll(() => {
    db = getPrisma();
    repo = new TaskRepository(db);
  });

  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const organization = await factories.organization.createOne();
    userId = user.id;
    organizationId = organization.id;
    await db.member.create({
      data: { organizationId, userId, role: "owner" },
    });
  });

  it("initializes default statuses idempotently", async () => {
    await Promise.all([
      repo.ensureDefaultStatuses(organizationId),
      repo.ensureDefaultStatuses(organizationId),
    ]);
    const statuses = await repo.listStatuses(organizationId);
    expect(statuses.map(({ name }) => name)).toEqual([
      "Todo",
      "In Progress",
      "Done",
    ]);
  });

  it("rejects status, assignee, and resource IDs from another organization", async () => {
    const otherOrganization = await getFactories().organization.createOne();
    await repo.ensureDefaultStatuses(organizationId);
    await repo.ensureDefaultStatuses(otherOrganization.id);
    const foreignStatus = (await repo.listStatuses(otherOrganization.id))[0];
    await expect(
      repo.create(organizationId, userId, {
        title: "Unsafe",
        statusId: foreignStatus.id,
        priority: "HIGH",
      }),
    ).rejects.toThrow("status");
  });

  it("allows only owners and administrators to manage statuses", async () => {
    const member = await getFactories().user.createOne();
    await db.member.create({
      data: { organizationId, userId: member.id, role: "member" },
    });
    await expect(
      repo.createStatus(organizationId, member.id, {
        name: "Review",
        marksTaskDone: false,
        colorToken: "#5c73ff",
      }),
    ).rejects.toThrow("owners and administrators");
  });

  it("tracks completion and requires replacement for a populated status", async () => {
    const statuses = await repo.listStatuses(organizationId);
    const todo = statuses[0];
    const done = statuses[2];
    const task = await repo.create(organizationId, userId, {
      title: "Review",
      statusId: todo.id,
      priority: "MEDIUM",
    });
    expect(
      (await repo.move(task.id, organizationId, done.id)).completedAt,
    ).not.toBeNull();
    expect(
      (await repo.move(task.id, organizationId, todo.id)).completedAt,
    ).toBeNull();
    await expect(
      repo.deleteStatus(todo.id, organizationId, userId),
    ).rejects.toThrow("replacement");
    await expect(
      repo.deleteStatus(todo.id, organizationId, userId, done.id),
    ).resolves.toBe(true);
  });
});
