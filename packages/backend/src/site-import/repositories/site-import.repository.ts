import type { PrismaClient } from "@prisma/client";
import type {
  CreateSiteImportData,
  UpdateSiteImportData,
  CreateSiteImportFileData,
} from "../types";

export class SiteImportRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.siteImport.findUnique({
      where: { id },
    });
  }

  async findByJobId(jobId: string) {
    return this.db.siteImport.findUnique({
      where: { jobId },
    });
  }

  async listByOrganization(
    organizationId: string,
    search?: string,
    limit = 20,
  ) {
    const where: Record<string, unknown> = {
      organizationId,
      status: { in: ["COMPLETED", "PARTIAL"] },
    };

    if (search) {
      where.url = { contains: search, mode: "insensitive" };
    }

    return this.db.siteImport.findMany({
      where,
      include: { _count: { select: { files: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async create(data: CreateSiteImportData) {
    return this.db.siteImport.create({
      data: {
        jobId: data.jobId,
        url: data.url,
        includeAssets: data.includeAssets,
        organizationId: data.organizationId,
        createdById: data.createdById,
      },
    });
  }

  async update(id: string, data: UpdateSiteImportData) {
    return this.db.siteImport.update({
      where: { id },
      data: {
        finalUrl: data.finalUrl,
        status: data.status,
        html: data.html,
        assetDiscovered: data.assetDiscovered,
        assetDownloaded: data.assetDownloaded,
        assetFailed: data.assetFailed,
        assetSkipped: data.assetSkipped,
      },
    });
  }

  async createFile(data: CreateSiteImportFileData) {
    return this.db.siteImportFile.create({
      data: {
        siteImportId: data.siteImportId,
        fileId: data.fileId,
        originalUrl: data.originalUrl,
        resolvedUrl: data.resolvedUrl,
        localPath: data.localPath,
        contentHash: data.contentHash,
        downloadStatus: data.downloadStatus,
      },
    });
  }

  async findFileById(id: string) {
    const row = await this.db.siteImportFile.findUnique({
      where: { id },
      include: { file: { include: { storedObject: true } } },
    });
    if (!row) return null;
    return {
      ...row,
      file: { ...row.file, remoteId: row.file.storedObject.remoteId },
    };
  }

  async findFilesByImportId(siteImportId: string) {
    return this.db.siteImportFile.findMany({
      where: { siteImportId },
    });
  }

  async findExpiredUnreferenced(olderThan: Date) {
    return this.db.siteImport.findMany({
      where: {
        createdAt: { lt: olderThan },
        job: { status: { in: ["COMPLETED", "FAILED"] } },
      },
      include: {
        files: { include: { file: true } },
      },
    });
  }

  async delete(id: string) {
    return this.db.siteImport.delete({ where: { id } });
  }
}
