import { faker } from "@faker-js/faker";
import type { PrismaClient, SiteImportFile } from "@prisma/client";
import { Factory } from "./factory";

interface SiteImportFileCreateData {
  siteImportId: string;
  fileId: string;
  originalUrl?: string;
  resolvedUrl?: string;
  localPath?: string;
}

export class SiteImportFileFactory extends Factory<
  SiteImportFileCreateData,
  SiteImportFile
> {
  constructor(prisma: PrismaClient) {
    super((data) => {
      const fileName =
        data.localPath?.split("/").pop() ?? faker.system.fileName();
      const path = data.localPath ?? `assets/${fileName}`;
      const url = data.originalUrl ?? `https://example.com/${path}`;

      return prisma.siteImportFile.create({
        data: {
          siteImportId: data.siteImportId,
          fileId: data.fileId,
          originalUrl: url,
          resolvedUrl: data.resolvedUrl ?? url,
          localPath: path,
        },
      });
    });
  }

  getShape(): SiteImportFileCreateData {
    return {
      siteImportId: "",
      fileId: "",
    };
  }
}
