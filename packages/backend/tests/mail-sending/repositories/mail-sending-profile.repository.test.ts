import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { getPrisma } from "../../setup";
import { MailSendingProfileRepository } from "../../../src/mail-sending/repositories/mail-sending-profile.repository";
import { MailProviderType } from "@prisma/client";

describe("MailSendingProfileRepository", () => {
  let prisma: ReturnType<typeof getPrisma>;
  let repo: MailSendingProfileRepository;
  let orgId: string;

  beforeAll(() => {
    prisma = getPrisma();
    repo = new MailSendingProfileRepository(prisma);
  });

  beforeEach(async () => {
    const org = await prisma.organization.create({
      data: {
        name: "Test Org",
        slug: `test-org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    });
    orgId = org.id;
  });

  it("creates a mail sending profile", async () => {
    const profile = await repo.create({
      organizationId: orgId,
      name: "Test SMTP",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        password: { iv: "aa", tag: "bb", ciphertext: "cc" },
      },
    });

    expect(profile.id).toBeTruthy();
    expect(profile.name).toBe("Test SMTP");
    expect(profile.providerType).toBe(MailProviderType.SMTP);
    expect(profile.fromEmail).toBe("test@example.com");
  });

  it("finds profile by ID", async () => {
    const created = await repo.create({
      organizationId: orgId,
      name: "Test SMTP",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
    });

    const found = await repo.findById(created.id, orgId);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test SMTP");
  });

  it("returns null for non-existent profile", async () => {
    const found = await repo.findById("non-existent", orgId);
    expect(found).toBeNull();
  });

  it("finds profiles by organization ID", async () => {
    await repo.create({
      organizationId: orgId,
      name: "Profile 1",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
    });
    await repo.create({
      organizationId: orgId,
      name: "Profile 2",
      providerType: MailProviderType.MICROSOFT_GRAPH,
      fromName: "Test",
      fromEmail: "test2@example.com",
      providerConfig: {
        tenantId: "t",
        clientId: "c",
        clientSecret: "s",
        senderMailbox: "m@t.com",
      },
    });

    const { rows, total } = await repo.findByOrganizationId(orgId, {
      limit: 10,
      offset: 0,
    });

    expect(rows).toHaveLength(2);
    expect(total).toBe(2);
  });

  it("search filters by name", async () => {
    await repo.create({
      organizationId: orgId,
      name: "Production SMTP",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
    });
    await repo.create({
      organizationId: orgId,
      name: "Dev MS Graph",
      providerType: MailProviderType.MICROSOFT_GRAPH,
      fromName: "Test",
      fromEmail: "test2@example.com",
      providerConfig: {
        tenantId: "t",
        clientId: "c",
        clientSecret: "s",
        senderMailbox: "m@t.com",
      },
    });

    const result = await repo.findByOrganizationId(orgId, {
      search: "Production",
      limit: 10,
      offset: 0,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Production SMTP");
    expect(result.total).toBe(1);
  });

  it("updates a profile", async () => {
    const created = await repo.create({
      organizationId: orgId,
      name: "Old Name",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "old@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
    });

    const updated = await repo.update(created.id, orgId, {
      name: "New Name",
      fromEmail: "new@example.com",
    });

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("New Name");
    expect(updated!.fromEmail).toBe("new@example.com");
  });

  it("update returns null for non-existent profile", async () => {
    const result = await repo.update("non-existent", orgId, {
      name: "New Name",
    });
    expect(result).toBeNull();
  });

  it("deletes a profile", async () => {
    const created = await repo.create({
      organizationId: orgId,
      name: "To Delete",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
    });

    const deleted = await repo.delete(created.id, orgId);
    expect(deleted).toBe(true);

    const found = await repo.findById(created.id, orgId);
    expect(found).toBeNull();
  });

  it("delete returns false for non-existent profile", async () => {
    const result = await repo.delete("non-existent", orgId);
    expect(result).toBe(false);
  });

  it("finds default profile", async () => {
    await repo.create({
      organizationId: orgId,
      name: "Non-default",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
      isDefault: false,
    });
    await repo.create({
      organizationId: orgId,
      name: "Default",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "default@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
      isDefault: true,
    });

    const found = await repo.findDefault(orgId);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Default");
    expect(found!.isDefault).toBe(true);
  });

  it("getConfig returns providerConfig", async () => {
    const created = await repo.create({
      organizationId: orgId,
      name: "Test",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "test@example.com",
      providerConfig: { host: "smtp.example.com", port: 587 },
    });

    const config = await repo.getConfig(created.id, orgId);
    expect(config).toEqual({ host: "smtp.example.com", port: 587 });
  });

  it("getConfig throws for non-existent profile", async () => {
    await expect(repo.getConfig("non-existent", orgId)).rejects.toThrow(
      "MailSendingProfile non-existent not found",
    );
  });

  it("sorts by name ascending", async () => {
    await repo.create({
      organizationId: orgId,
      name: "B Profile",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "b@example.com",
      providerConfig: { host: "smtp.example.com" },
    });
    await repo.create({
      organizationId: orgId,
      name: "A Profile",
      providerType: MailProviderType.SMTP,
      fromName: "Test",
      fromEmail: "a@example.com",
      providerConfig: { host: "smtp.example.com" },
    });

    const { rows } = await repo.findByOrganizationId(orgId, {
      limit: 10,
      offset: 0,
      sort: [{ field: "name", order: "asc" }],
    });

    expect(rows[0].name).toBe("A Profile");
    expect(rows[1].name).toBe("B Profile");
  });
});
