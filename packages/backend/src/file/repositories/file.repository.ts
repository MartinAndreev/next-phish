import type { PrismaClient, FilePurpose } from "@prisma/client";
import type { CreateFileRowData } from "../types";

const fileSelect = {
  id: true,
  name: true,
  size: true,
  format: true,
  purpose: true,
  organizationId: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
  storedObject: { select: { remoteId: true } },
} as const;

function flattenStoredObject<T extends { storedObject: { remoteId: string } }>(
  row: T,
) {
  const { storedObject, ...file } = row;
  return { ...file, remoteId: storedObject.remoteId };
}

export class FileRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const row = await this.db.file.findFirst({
      where: { id, visibility: "CATALOG" },
      select: fileSelect,
    });
    return row ? flattenStoredObject(row) : null;
  }

  async findByRemoteId(remoteId: string) {
    const row = await this.db.file.findFirst({
      where: { storedObject: { remoteId }, visibility: "CATALOG" },
      select: fileSelect,
    });
    return row ? flattenStoredObject(row) : null;
  }

  async findByPurpose(purpose: FilePurpose, organizationId: string) {
    const rows = await this.db.file.findMany({
      where: { purpose, organizationId, visibility: "CATALOG" },
      select: fileSelect,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => flattenStoredObject(row));
  }

  async findByEmailTemplateId(emailTemplateId: string) {
    const rows = await this.db.file.findMany({
      where: {
        visibility: "CATALOG",
        emailTemplateFiles: { some: { emailTemplateId } },
      },
      select: fileSelect,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => flattenStoredObject(row));
  }

  async create(data: CreateFileRowData) {
    return this.db.$transaction(async (tx) => {
      const storedObject = await tx.storedObject.create({
        data: {
          remoteId: data.remoteId,
          size: data.size,
          format: data.format,
          organizationId: data.organizationId,
        },
      });
      const row = await tx.file.create({
        data: {
          storedObjectId: storedObject.id,
          name: data.name,
          size: data.size,
          format: data.format,
          purpose: data.purpose,
          organizationId: data.organizationId,
          uploadedById: data.uploadedById,
        },
        select: fileSelect,
      });
      return flattenStoredObject(row);
    });
  }

  async delete(
    id: string,
  ): Promise<{ deleted: boolean; orphanedRemoteId?: string }> {
    const row = await this.db.file.findFirst({
      where: { id, visibility: "CATALOG" },
      select: {
        storedObjectId: true,
        storedObject: { select: { remoteId: true } },
      },
    });
    if (!row) return { deleted: false };

    await this.db.file.delete({ where: { id } });
    const remaining = await this.db.file.count({
      where: { storedObjectId: row.storedObjectId },
    });
    if (remaining > 0) return { deleted: true };

    await this.db.storedObject.delete({ where: { id: row.storedObjectId } });
    return { deleted: true, orphanedRemoteId: row.storedObject.remoteId };
  }
}
