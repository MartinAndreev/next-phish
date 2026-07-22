import { describe, expect, it } from "vitest";
import {
  CreateTaskSchema,
  CreateTaskStatusSchema,
  ListTasksSchema,
  ReorderTaskStatusesSchema,
} from "../../src/task";

describe("task validations", () => {
  it("accepts a task with one typed relation", () => {
    expect(
      CreateTaskSchema.parse({
        title: "Review landing page",
        statusId: "status-1",
        priority: "HIGH",
        relation: { type: "PAGE", id: "page-1" },
      }),
    ).toMatchObject({ title: "Review landing page", priority: "HIGH" });
  });

  it("rejects unsupported relation types and empty titles", () => {
    expect(() =>
      CreateTaskSchema.parse({
        title: "",
        statusId: "status-1",
        relation: { type: "USER", id: "user-1" },
      }),
    ).toThrow();
  });

  it("bounds status filters and status ordering", () => {
    expect(() =>
      ListTasksSchema.parse({
        statusIds: Array.from({ length: 21 }, (_, index) => String(index)),
      }),
    ).toThrow();
    expect(() => ReorderTaskStatusesSchema.parse({ statusIds: [] })).toThrow();
  });

  it("validates custom status semantics", () => {
    expect(
      CreateTaskStatusSchema.parse({
        name: "Ready for review",
        marksTaskDone: false,
        colorToken: "#5c73ff",
      }),
    ).toEqual({
      name: "Ready for review",
      marksTaskDone: false,
      colorToken: "#5c73ff",
    });
  });
});
