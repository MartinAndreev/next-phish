import { faker } from "@faker-js/faker";
import type { PrismaClient, SiteImport, ImportStatus } from "@prisma/client";
import { Factory } from "./factory";

interface SiteImportCreateData {
  jobId: string;
  url: string;
  includeAssets?: boolean;
  status?: ImportStatus;
  organizationId: string;
  createdById: string;
}

export class SiteImportFactory extends Factory<
  SiteImportCreateData,
  SiteImport
> {
  constructor(prisma: PrismaClient) {
    super((data) =>
      prisma.siteImport.create({
        data: {
          jobId: data.jobId,
          url: data.url,
          includeAssets: data.includeAssets ?? false,
          status: data.status ?? "PENDING",
          organizationId: data.organizationId,
          createdById: data.createdById,
        },
      }),
    );
  }

  getShape(): SiteImportCreateData {
    return {
      jobId: "",
      url: faker.internet.url(),
      organizationId: "",
      createdById: "",
    };
  }
}
