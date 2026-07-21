import { faker } from "@faker-js/faker";
import type { PrismaClient, File } from "@prisma/client";
import { Factory } from "./factory";

interface FileCreateData {
  remoteId?: string;
  name?: string;
  size?: number;
  format?: string;
  purpose?: string;
  organizationId: string;
  uploadedById: string;
}

export class FileFactory extends Factory<FileCreateData, File> {
  constructor(prisma: PrismaClient) {
    super(async (data) => {
      const size = data.size ?? faker.number.int({ min: 100, max: 100000 });
      const format = data.format ?? faker.system.mimeType();
      const storedObject = await prisma.storedObject.create({
        data: {
          remoteId:
            data.remoteId ?? `${data.organizationId}/${faker.string.uuid()}`,
          size,
          format,
          organizationId: data.organizationId,
        },
      });
      return prisma.file.create({
        data: {
          storedObjectId: storedObject.id,
          name: data.name ?? faker.system.fileName(),
          size,
          format,
          purpose: (data.purpose as never) ?? "IMPORT",
          organizationId: data.organizationId,
          uploadedById: data.uploadedById,
        },
      });
    });
  }

  getShape(): FileCreateData {
    return {
      organizationId: "",
      uploadedById: "",
    };
  }
}
