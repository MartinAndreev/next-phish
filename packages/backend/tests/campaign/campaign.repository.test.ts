import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { CampaignRepository } from "../../src/campaign/repositories";
import { EmailTemplateRepository } from "../../src/email-template/repositories/email-template.repository";
import { PageRepository } from "../../src/page/repositories/page.repository";
import { getFactories, getPrisma } from "../setup";

describe("CampaignRepository", () => {
  let db: PrismaClient;
  let repo: CampaignRepository;
  let organizationId: string;
  let userId: string;
  let refs: {
    emailTemplateId: string;
    pageId: string;
    mailSendingProfileId: string;
    targetGroupId: string;
  };

  beforeAll(() => {
    db = getPrisma();
    repo = new CampaignRepository(db);
  });
  beforeEach(async () => {
    const factories = getFactories();
    const user = await factories.user.createOne();
    const organization = await factories.organization.createOne();
    userId = user.id;
    organizationId = organization.id;
    const storedObject = await db.storedObject.create({
      data: {
        remoteId: `test/${crypto.randomUUID()}`,
        size: 10,
        format: "text/plain",
        organizationId,
      },
    });
    const file = await db.file.create({
      data: {
        storedObjectId: storedObject.id,
        name: "attachment.txt",
        size: 10,
        format: "text/plain",
        organizationId,
        uploadedById: userId,
      },
    });
    const email = await db.emailTemplate.create({
      data: {
        name: "Email",
        tags: [],
        html: "<p>Hello</p>",
        design: {},
        organizationId,
        createdById: userId,
        status: "ACTIVE",
        files: { create: { fileId: file.id } },
      },
    });
    const page = await db.page.create({
      data: {
        name: "Landing",
        html: "<h1>Hi</h1>",
        organizationId,
        createdById: userId,
        status: "ACTIVE",
      },
    });
    const profile = await db.mailSendingProfile.create({
      data: {
        organizationId,
        name: "SMTP",
        providerType: "SMTP",
        fromName: "Sender",
        fromEmail: "sender@example.test",
        providerConfig: {},
      },
    });
    const group = await db.targetGroup.create({
      data: {
        name: "Targets",
        organizationId,
        createdById: userId,
        status: "ACTIVE",
        users: {
          create: [
            {
              email: " User@Example.test ",
              normalizedEmail: "user@example.test",
              firstName: "A",
              lastName: "B",
            },
          ],
        },
      },
    });
    refs = {
      emailTemplateId: email.id,
      pageId: page.id,
      mailSendingProfileId: profile.id,
      targetGroupId: group.id,
    };
  });

  it("rejects cross-organization campaign resources", async () => {
    const other = await getFactories().organization.createOne();
    await expect(
      repo.createCampaign(other.id, userId, {
        name: "Invalid",
        tags: [],
        type: "CONCRETE",
        status: "DRAFT",
        ...refs,
        targetTimezone: "UTC",
        autoCompleteAfterDays: 20,
      }),
    ).rejects.toThrow(/organization/);
  });

  it("hides shadow templates from catalog repositories", async () => {
    const shadowOwner = await db.campaign.create({
      data: {
        name: "Shadow owner",
        type: "CONCRETE",
        organizationId,
        createdById: userId,
        targetTimezone: "UTC",
      },
    });
    await db.emailTemplate.create({
      data: {
        name: "Shadow",
        tags: [],
        html: "",
        design: {},
        organizationId,
        createdById: userId,
        visibility: "SHADOW",
        shadowCampaignId: shadowOwner.id,
        status: "ACTIVE",
      },
    });
    const result = await new EmailTemplateRepository(db).findByOrganizationId(
      organizationId,
      { limit: 50, offset: 0 },
    );
    expect(result.rows.map((row) => row.name)).toEqual(["Email"]);
    expect(result.rows[0]?.html).toBeUndefined();
  });

  it("orders selected catalog assets first while preserving pagination", async () => {
    await db.emailTemplate.create({
      data: {
        name: "Newer email",
        tags: [],
        html: "<p>New</p>",
        design: {},
        organizationId,
        createdById: userId,
        status: "ACTIVE",
      },
    });
    await db.page.create({
      data: {
        name: "Newer page",
        html: "<p>New</p>",
        organizationId,
        createdById: userId,
        status: "ACTIVE",
      },
    });

    const emails = await new EmailTemplateRepository(db).findByOrganizationId(
      organizationId,
      {
        selectedId: refs.emailTemplateId,
        includeContent: true,
        limit: 1,
        offset: 0,
        filters: { status: "ACTIVE" },
      },
    );
    const pages = await new PageRepository(db).findByOrganizationId(
      organizationId,
      {
        selectedId: refs.pageId,
        includeContent: true,
        limit: 1,
        offset: 0,
        filters: { status: "ACTIVE", type: "LANDING" },
      },
    );

    expect(emails.rows[0]?.id).toBe(refs.emailTemplateId);
    expect(emails.rows[0]?.html).toBe("<p>Hello</p>");
    expect(emails.total).toBe(2);
    expect(pages.rows[0]?.id).toBe(refs.pageId);
    expect(pages.rows[0]?.html).toBe("<h1>Hi</h1>");
    expect(pages.total).toBe(2);
  });

  it("materializes relational shadows and shares immutable attachment objects", async () => {
    const source = await repo.createCampaign(organizationId, userId, {
      name: "Template",
      tags: ["awareness"],
      type: "TEMPLATE",
      status: "DRAFT",
      emailTemplateId: refs.emailTemplateId,
      pageId: refs.pageId,
      mailSendingProfileId: refs.mailSendingProfileId,
      targetGroupId: null,
      targetTimezone: "UTC",
      autoCompleteAfterDays: 20,
    });
    await repo.publish(source.id, organizationId);
    const { schedule } = await repo.createSchedule(organizationId, userId, {
      name: "One time",
      type: "ONE_TIME",
      sourceCampaignIds: [source.id],
      targetGroupId: refs.targetGroupId,
      targetTimezone: "UTC",
      startsAt: new Date("2030-01-01T12:00:00Z"),
      frequency: null,
      localTimeMinutes: null,
      weekday: null,
      dayOfMonth: null,
      month: null,
      selectionStrategy: null,
      shuffleDeck: false,
      deliveryMode: "BLAST",
      dripEmailsPerMinute: null,
      batchSize: null,
      batchIntervalMinutes: null,
      maxCampaigns: null,
      endsAt: null,
      autoCompleteAfterDays: 20,
    });
    await db.targetGroupUser.createMany({
      data: Array.from({ length: 5 }, (_, index) => ({
        targetGroupId: refs.targetGroupId,
        email: `batch-${index}@example.com`,
        normalizedEmail: `batch-${index}@example.com`,
        firstName: "Batch",
        lastName: String(index),
      })),
    });
    process.env.MATERIALIZATION_BATCH_SIZE = "2";
    const run = await repo.materializeOccurrence(
      schedule.id,
      source.id,
      new Date("2030-01-01T12:00:00Z"),
      organizationId,
      userId,
    );

    delete process.env.MATERIALIZATION_BATCH_SIZE;

    const repeated = await repo.materializeOccurrence(
      schedule.id,
      source.id,
      new Date("2030-01-01T12:00:00Z"),
      organizationId,
      userId,
    );

    expect(repeated.id).toBe(run.id);
    expect(
      await db.campaign.count({
        where: { scheduleId: schedule.id, occurrenceAt: run.occurrenceAt },
      }),
    ).toBe(1);
    expect(run.status).toBe("SCHEDULED");
    expect(run.tags).toEqual(["awareness"]);
    expect(run.emailTemplate?.visibility).toBe("SHADOW");
    expect(run.targetGroup?.visibility).toBe("SHADOW");
    expect(run.materializedAt).toBeInstanceOf(Date);
    expect(run.expectedRecipientCount).toBe(6);
    expect(
      await db.campaignRecipient.count({ where: { campaignId: run.id } }),
    ).toBe(6);
    const files = await db.file.findMany({
      where: { shadowCampaignId: run.id },
    });
    const original = await db.emailTemplateFile.findFirstOrThrow({
      where: { emailTemplateId: refs.emailTemplateId },
      include: { file: true },
    });
    expect(files).toHaveLength(1);
    expect(files[0].storedObjectId).toBe(original.file.storedObjectId);
  });
});
