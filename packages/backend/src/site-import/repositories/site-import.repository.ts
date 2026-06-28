import type { PrismaClient } from "@prisma/client";
import type {
  CreateSiteImportData,
  UpdateSiteImportData,
  CreateSiteImportFileData,
} from "../types";

const siteImportSelect = {
  id: true,
  jobId: true,
  url: true,
  finalUrl: true,
  status: true,
  includeAssets: true,
  html: true,
  assetDiscovered: true,
  assetDownloaded: true,
  assetFailed: true,
  assetSkipped: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

const siteImportFileSelect = {
  id: true,
  siteImportId: true,
  fileId: true,
  originalUrl: true,
  resolvedUrl: true,
  localPath: true,
  contentHash: true,
  downloadStatus: true,
  createdAt: true,
} as const;

export class SiteImportRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.siteImport.findUnique({
      where: { id },
      select: siteImportSelect,
    });
  }

  async findByJobId(jobId: string) {
    return this.db.siteImport.findUnique({
      where: { jobId },
      select: siteImportSelect,
    });
  }

  async listByOrganization(organizationId: string, limit = 20) {
    return this.db.siteImport.findMany({
      where: { organizationId, status: { in: ["COMPLETED", "PARTIAL"] } },
      select: {
        ...siteImportSelect,
        _count: { select: { files: true } },
      },
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
      select: siteImportSelect,
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
      select: siteImportSelect,
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
      select: siteImportFileSelect,
    });
  }

  async findFileById(id: string) {
    return this.db.siteImportFile.findUnique({
      where: { id },
      select: {
        ...siteImportFileSelect,
        file: {
          select: {
            id: true,
            remoteId: true,
            name: true,
            format: true,
          },
        },
      },
    });
  }

  async findFilesByImportId(siteImportId: string) {
    return this.db.siteImportFile.findMany({
      where: { siteImportId },
      select: siteImportFileSelect,
    });
  }

  async findExpiredUnreferenced(olderThan: Date) {
    return this.db.siteImport.findMany({
      where: {
        createdAt: { lt: olderThan },
        job: { status: { in: ["COMPLETED", "FAILED"] } },
      },
      select: {
        id: true,
        files: {
          select: {
            id: true,
            fileId: true,
            file: { select: { remoteId: true } },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.db.siteImport.delete({ where: { id } });
  }
}
