import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  TaskRelationInput,
  TaskStatusView,
  TaskStatusWriteData,
  TaskView,
  TaskWriteData,
} from "../types/task.types";

const taskInclude = {
  status: true,
  assignee: { select: { id: true, name: true, email: true } },
  campaign: { select: { id: true, name: true } },
  schedule: { select: { id: true, name: true } },
  page: { select: { id: true, name: true } },
  emailTemplate: { select: { id: true, name: true } },
  targetGroup: { select: { id: true, name: true } },
  mailSendingProfile: { select: { id: true, name: true } },
} as const;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export class TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  async ensureDefaultStatuses(organizationId: string): Promise<void> {
    const count = await this.db.taskStatus.count({ where: { organizationId } });
    if (count) return;
    await this.db.taskStatus.createMany({
      data: [
        {
          organizationId,
          name: "Todo",
          normalizedName: "todo",
          colorToken: "#64748b",
          marksTaskDone: false,
          position: 0,
        },
        {
          organizationId,
          name: "In Progress",
          normalizedName: "in progress",
          colorToken: "#29b8ff",
          marksTaskDone: false,
          position: 1,
        },
        {
          organizationId,
          name: "Done",
          normalizedName: "done",
          colorToken: "#15e5d4",
          marksTaskDone: true,
          position: 2,
        },
      ],
      skipDuplicates: true,
    });
  }

  async listStatuses(organizationId: string): Promise<TaskStatusView[]> {
    await this.ensureDefaultStatuses(organizationId);
    const rows = await this.db.taskStatus.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
      include: { _count: { select: { tasks: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      colorToken: row.colorToken as TaskStatusView["colorToken"],
      marksTaskDone: row.marksTaskDone,
      position: row.position,
      taskCount: row._count.tasks,
    }));
  }

  async list(
    organizationId: string,
    input: {
      statusIds?: string[];
      assigneeId?: string;
      search?: string;
      limit: number;
      offset: number;
    },
  ) {
    await this.ensureDefaultStatuses(organizationId);
    const where: Prisma.TaskWhereInput = {
      organizationId,
      statusId: input.statusIds?.length ? { in: input.statusIds } : undefined,
      assigneeId: input.assigneeId,
      OR: input.search
        ? [
            { title: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    const [rows, total] = await Promise.all([
      this.db.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ status: { position: "asc" } }, { updatedAt: "desc" }],
        take: input.limit,
        skip: input.offset,
      }),
      this.db.task.count({ where }),
    ]);
    return { tasks: rows.map((row) => this.toView(row)), total };
  }

  async get(id: string, organizationId: string): Promise<TaskView | null> {
    const row = await this.db.task.findFirst({
      where: { id, organizationId },
      include: taskInclude,
    });
    return row ? this.toView(row) : null;
  }

  async create(
    organizationId: string,
    createdById: string,
    data: TaskWriteData,
  ): Promise<TaskView> {
    await this.validateReferences(
      organizationId,
      data.statusId,
      data.assigneeId,
      data.relation,
    );
    const status = await this.db.taskStatus.findFirstOrThrow({
      where: { id: data.statusId, organizationId },
    });
    const row = await this.db.task.create({
      data: {
        organizationId,
        createdById,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        statusId: data.statusId,
        priority: data.priority,
        assigneeId: data.assigneeId || null,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        completedAt: status.marksTaskDone ? new Date() : null,
        ...this.relationData(data.relation),
      },
      include: taskInclude,
    });
    return this.toView(row);
  }

  async update(
    id: string,
    organizationId: string,
    data: Partial<TaskWriteData>,
  ): Promise<TaskView> {
    const current = await this.db.task.findFirst({
      where: { id, organizationId },
    });
    if (!current) throw new Error("Task not found");
    const statusId = data.statusId ?? current.statusId;
    await this.validateReferences(
      organizationId,
      statusId,
      data.assigneeId,
      data.relation,
    );
    const status = await this.db.taskStatus.findFirstOrThrow({
      where: { id: statusId, organizationId },
    });
    await this.db.task.updateMany({
      where: { id, organizationId },
      data: {
        title: data.title?.trim(),
        description:
          data.description === undefined
            ? undefined
            : data.description.trim() || null,
        statusId: data.statusId,
        priority: data.priority,
        assigneeId:
          data.assigneeId === undefined ? undefined : data.assigneeId || null,
        dueAt:
          data.dueAt === undefined
            ? undefined
            : data.dueAt
              ? new Date(data.dueAt)
              : null,
        completedAt: status.marksTaskDone
          ? (current.completedAt ?? new Date())
          : null,
        ...(data.relation === undefined
          ? {}
          : this.clearAndSetRelation(data.relation)),
      },
    });
    return (await this.get(id, organizationId))!;
  }

  async move(
    id: string,
    organizationId: string,
    statusId: string,
  ): Promise<TaskView> {
    const task = await this.db.task.findFirst({
      where: { id, organizationId },
    });
    const status = await this.db.taskStatus.findFirst({
      where: { id: statusId, organizationId },
    });
    if (!task || !status) throw new Error("Task or status not found");
    await this.db.task.update({
      where: { id },
      data: {
        statusId,
        completedAt: status.marksTaskDone
          ? (task.completedAt ?? new Date())
          : null,
      },
    });
    return (await this.get(id, organizationId))!;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    return (
      (await this.db.task.deleteMany({ where: { id, organizationId } })).count >
      0
    );
  }

  async createStatus(
    organizationId: string,
    actorId: string,
    data: TaskStatusWriteData,
  ): Promise<TaskStatusView> {
    await this.assertStatusManager(organizationId, actorId);
    const count = await this.db.taskStatus.count({ where: { organizationId } });
    if (count >= 20)
      throw new Error("An organization can have at most 20 task statuses");
    const row = await this.db.taskStatus.create({
      data: {
        organizationId,
        name: data.name.trim(),
        normalizedName: data.name.trim().toLowerCase(),
        colorToken: data.colorToken,
        marksTaskDone: data.marksTaskDone,
        position: count,
      },
    });
    return {
      ...row,
      colorToken: row.colorToken as TaskStatusView["colorToken"],
    };
  }

  async updateStatus(
    id: string,
    organizationId: string,
    actorId: string,
    data: Partial<TaskStatusWriteData>,
  ): Promise<TaskStatusView> {
    await this.assertStatusManager(organizationId, actorId);
    const current = await this.db.taskStatus.findFirst({
      where: { id, organizationId },
    });
    if (!current) throw new Error("Task status not found");
    const row = await this.db.taskStatus.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        normalizedName: data.name?.trim().toLowerCase(),
        colorToken: data.colorToken,
        marksTaskDone: data.marksTaskDone,
      },
    });
    if (data.marksTaskDone === true) {
      await this.db.task.updateMany({
        where: { organizationId, statusId: id, completedAt: null },
        data: { completedAt: new Date() },
      });
    } else if (data.marksTaskDone === false) {
      await this.db.task.updateMany({
        where: { organizationId, statusId: id },
        data: { completedAt: null },
      });
    }
    return {
      ...row,
      colorToken: row.colorToken as TaskStatusView["colorToken"],
    };
  }

  async reorderStatuses(
    organizationId: string,
    actorId: string,
    statusIds: string[],
  ): Promise<TaskStatusView[]> {
    await this.assertStatusManager(organizationId, actorId);
    const current = await this.db.taskStatus.findMany({
      where: { organizationId },
      select: { id: true },
    });
    if (
      current.length !== statusIds.length ||
      new Set(statusIds).size !== statusIds.length ||
      current.some(({ id }) => !statusIds.includes(id))
    )
      throw new Error(
        "Status order must include every organization status exactly once",
      );
    await this.db.$transaction(async (tx) => {
      for (let i = 0; i < statusIds.length; i++)
        await tx.taskStatus.update({
          where: { id: statusIds[i] },
          data: { position: -(i + 1) },
        });
      for (let i = 0; i < statusIds.length; i++)
        await tx.taskStatus.update({
          where: { id: statusIds[i] },
          data: { position: i },
        });
    });
    return this.listStatuses(organizationId);
  }

  async deleteStatus(
    id: string,
    organizationId: string,
    actorId: string,
    replacementStatusId?: string,
  ): Promise<boolean> {
    await this.assertStatusManager(organizationId, actorId);
    return this.db.$transaction(async (tx) => {
      const statuses = await tx.taskStatus.findMany({
        where: { organizationId },
      });
      const source = statuses.find((status) => status.id === id);
      if (!source) return false;
      if (statuses.length <= 1)
        throw new Error("The last task status cannot be deleted");
      const taskCount = await tx.task.count({
        where: { organizationId, statusId: id },
      });
      if (taskCount) {
        const replacement = statuses.find(
          (status) => status.id === replacementStatusId && status.id !== id,
        );
        if (!replacement) throw new Error("A replacement status is required");
        await tx.task.updateMany({
          where: { organizationId, statusId: id },
          data: {
            statusId: replacement.id,
            completedAt: replacement.marksTaskDone ? new Date() : null,
          },
        });
      }
      await tx.taskStatus.delete({ where: { id } });
      const remaining = statuses
        .filter((status) => status.id !== id)
        .sort((a, b) => a.position - b.position);
      for (let i = 0; i < remaining.length; i++)
        await tx.taskStatus.update({
          where: { id: remaining[i].id },
          data: { position: i },
        });
      return true;
    });
  }

  private async assertStatusManager(organizationId: string, actorId: string) {
    const membership = await this.db.member.findFirst({
      where: {
        organizationId,
        userId: actorId,
        role: { in: ["owner", "admin"] },
      },
      select: { id: true },
    });
    if (!membership)
      throw new Error(
        "Only organization owners and administrators can manage task statuses",
      );
  }

  private async validateReferences(
    organizationId: string,
    statusId: string,
    assigneeId?: string | null,
    relation?: TaskRelationInput | null,
  ) {
    if (
      !(await this.db.taskStatus.findFirst({
        where: { id: statusId, organizationId },
        select: { id: true },
      }))
    )
      throw new Error("Task status is unavailable");
    if (
      assigneeId &&
      !(await this.db.member.findFirst({
        where: { userId: assigneeId, organizationId },
        select: { id: true },
      }))
    )
      throw new Error("Assignee is not an organization member");
    if (!relation) return;
    const common = { id: relation.id, organizationId };
    let exists: unknown;
    if (relation.type === "CAMPAIGN")
      exists = await this.db.campaign.findFirst({
        where: common,
        select: { id: true },
      });
    if (relation.type === "SCHEDULE")
      exists = await this.db.schedule.findFirst({
        where: common,
        select: { id: true },
      });
    if (relation.type === "PAGE")
      exists = await this.db.page.findFirst({
        where: { ...common, visibility: "CATALOG" },
        select: { id: true },
      });
    if (relation.type === "EMAIL_TEMPLATE")
      exists = await this.db.emailTemplate.findFirst({
        where: { ...common, visibility: "CATALOG" },
        select: { id: true },
      });
    if (relation.type === "TARGET_GROUP")
      exists = await this.db.targetGroup.findFirst({
        where: { ...common, visibility: "CATALOG" },
        select: { id: true },
      });
    if (relation.type === "SENDING_PROFILE")
      exists = await this.db.mailSendingProfile.findFirst({
        where: { ...common, visibility: "CATALOG" },
        select: { id: true },
      });
    if (!exists) throw new Error("Related resource is unavailable");
  }

  private relationData(relation?: TaskRelationInput | null) {
    if (!relation) return {};
    const fields = {
      CAMPAIGN: "campaignId",
      SCHEDULE: "scheduleId",
      PAGE: "pageId",
      EMAIL_TEMPLATE: "emailTemplateId",
      TARGET_GROUP: "targetGroupId",
      SENDING_PROFILE: "mailSendingProfileId",
    } as const;
    return { [fields[relation.type]]: relation.id };
  }

  private clearAndSetRelation(relation?: TaskRelationInput | null) {
    return {
      campaignId: null,
      scheduleId: null,
      pageId: null,
      emailTemplateId: null,
      targetGroupId: null,
      mailSendingProfileId: null,
      ...this.relationData(relation),
    };
  }

  private toView(row: TaskRow): TaskView {
    const candidates = [
      row.campaign && {
        type: "CAMPAIGN" as const,
        ...row.campaign,
        href: `/campaigns/${row.campaign.id}`,
      },
      row.schedule && {
        type: "SCHEDULE" as const,
        ...row.schedule,
        href: `/schedule/${row.schedule.id}`,
      },
      row.page && {
        type: "PAGE" as const,
        ...row.page,
        href: `/pages/${row.page.id}`,
      },
      row.emailTemplate && {
        type: "EMAIL_TEMPLATE" as const,
        ...row.emailTemplate,
        href: `/email-templates/${row.emailTemplate.id}`,
      },
      row.targetGroup && {
        type: "TARGET_GROUP" as const,
        ...row.targetGroup,
        href: `/target-groups/${row.targetGroup.id}`,
      },
      row.mailSendingProfile && {
        type: "SENDING_PROFILE" as const,
        ...row.mailSendingProfile,
        href: `/sending-profiles/${row.mailSendingProfile.id}`,
      },
    ];
    return {
      id: row.id,
      organizationId: row.organizationId,
      title: row.title,
      description: row.description,
      priority: row.priority,
      dueAt: row.dueAt,
      completedAt: row.completedAt,
      isOverdue: Boolean(
        row.dueAt &&
        row.dueAt.getTime() < Date.now() &&
        !row.status.marksTaskDone,
      ),
      statusId: row.statusId,
      status: {
        id: row.status.id,
        organizationId: row.status.organizationId,
        name: row.status.name,
        colorToken: row.status.colorToken as TaskStatusView["colorToken"],
        marksTaskDone: row.status.marksTaskDone,
        position: row.status.position,
      },
      assignee: row.assignee,
      relation: candidates.find(Boolean) || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
