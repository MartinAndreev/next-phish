import { Container } from "typedi";
import { UploadFileCommand } from "../../file/commands/upload-file.command";
import { SiteImportRepository } from "../repositories";
import { SiteImportService } from "../services";
import type { ImportContext, ImportHandler, DownloadedAsset } from "../types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DOWNLOAD_TIMEOUT = 10000; // 10s per file
const MAX_ASSETS = 100;
const CONCURRENCY = 5;

async function downloadAsset(
  url: string,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NextPhish-Importer/1.0" },
    });

    if (!response.ok) return null;

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const contentLength = Number(response.headers.get("content-length") || 0);

    if (contentLength > MAX_FILE_SIZE) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_SIZE) return null;

    return { buffer, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const last = parts[parts.length - 1];
    if (last && last.includes(".")) return last;
  } catch {
    // ignore invalid URLs
  }
  return "asset";
}

function getContentTypeFromUrl(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  const map: Record<string, string> = {
    css: "text/css",
    js: "application/javascript",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    otf: "font/otf",
  };
  return map[ext] || "application/octet-stream";
}

export class DownloadAssetsHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    if (ctx.assetCandidates.length === 0) {
      await next();
      return;
    }

    const uploadCmd = Container.get(UploadFileCommand);
    const siteImportRepo = Container.get(SiteImportRepository);
    const siteImportService = Container.get(SiteImportService);

    const candidates = ctx.assetCandidates.slice(0, MAX_ASSETS);
    const downloaded: DownloadedAsset[] = [];
    let failed = 0;
    const skipped = 0;

    for (let i = 0; i < candidates.length; i += CONCURRENCY) {
      const batch = candidates.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (candidate) => {
          const result = await downloadAsset(candidate.resolvedUrl);
          if (!result) {
            return { candidate, status: "failed" as const };
          }

          const { buffer, contentType } = result;
          const filename = getFilenameFromUrl(candidate.resolvedUrl);
          const localPath = siteImportService.generateLocalPath(
            candidate.resolvedUrl,
          );
          const remoteId = siteImportService.generateRemoteId(
            ctx.organizationId,
            ctx.siteImportId,
            filename,
          );

          const body = Buffer.from(buffer);
          const effectiveContentType = contentType.includes("text/html")
            ? getContentTypeFromUrl(candidate.resolvedUrl)
            : contentType;

          const uploadedFile = await uploadCmd.execute({
            remoteId,
            name: filename,
            size: body.length,
            format: effectiveContentType,
            purpose: "IMPORT",
            organizationId: ctx.organizationId,
            uploadedById: ctx.createdById,
            body: body.toString("base64"),
          });

          const file = await siteImportRepo.createFile({
            siteImportId: ctx.siteImportId,
            fileId: uploadedFile.id,
            originalUrl: candidate.originalUrl,
            resolvedUrl: candidate.resolvedUrl,
            localPath,
            downloadStatus: "downloaded",
          });

          return {
            candidate,
            status: "downloaded" as const,
            siteImportFileId: file.id,
            remoteId,
            localPath,
            size: body.length,
            contentType: effectiveContentType,
          };
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          const { value } = result;
          if (value.status === "downloaded") {
            downloaded.push({
              candidate: value.candidate,
              siteImportFileId: value.siteImportFileId,
              remoteId: value.remoteId,
              localPath: value.localPath,
              contentHash: "",
              size: value.size,
              contentType: value.contentType,
            });
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      }
    }

    ctx.downloadedAssets = downloaded;
    ctx.stats.downloaded = downloaded.length;
    ctx.stats.failed = failed;
    ctx.stats.skipped = skipped;

    await siteImportRepo.update(ctx.siteImportId, {
      assetDiscovered: ctx.stats.discovered,
      assetDownloaded: ctx.stats.downloaded,
      assetFailed: ctx.stats.failed,
      assetSkipped: ctx.stats.skipped,
    });

    await next();
  }
}
