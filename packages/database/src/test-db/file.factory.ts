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
    super((data) =>
      prisma.file.create({
        data: {
          remoteId:
            data.remoteId ?? `${data.organizationId}/${faker.string.uuid()}`,
          name: data.name ?? faker.system.fileName(),
          size: data.size ?? faker.number.int({ min: 100, max: 100000 }),
          format: data.format ?? faker.system.mimeType(),
          purpose: (data.purpose as never) ?? "IMPORT",
          organizationId: data.organizationId,
          uploadedById: data.uploadedById,
        },
      }),
    );
  }

  getShape(): FileCreateData {
    return {
      organizationId: "",
      uploadedById: "",
    };
  }
}
