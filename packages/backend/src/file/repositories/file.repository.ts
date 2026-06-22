import type { PrismaClient, FilePurpose } from "@prisma/client";
import type { CreateFileRowData } from "../types";

const fileSelect = {
  id: true,
  remoteId: true,
  name: true,
  size: true,
  format: true,
  purpose: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class FileRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.file.findUnique({
      where: { id },
      select: fileSelect,
    });
  }

  async findByRemoteId(remoteId: string) {
    return this.db.file.findFirst({
      where: { remoteId },
      select: fileSelect,
    });
  }

  async findByPurpose(purpose: FilePurpose) {
    return this.db.file.findMany({
      where: { purpose },
      select: fileSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByEmailTemplateId(emailTemplateId: string) {
    return this.db.file.findMany({
      where: {
        emailTemplateFiles: { some: { emailTemplateId } },
      },
      select: fileSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateFileRowData) {
    return this.db.file.create({
      data,
      select: fileSelect,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.file.deleteMany({
      where: { id },
    });
    return result.count > 0;
  }
}
