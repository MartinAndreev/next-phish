import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { R2Client } from "../storage/r2-client";

export interface UploadCatalogPreviewInput {
  organizationId: string;
  uploadedById: string;
  resourceType: "EMAIL_TEMPLATE" | "PAGE";
  resourceId: string;
  sourceRevision: number;
  format: "image/png" | "image/webp";
  body: string;
}

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 16384;

function imageDimensions(
  buffer: Buffer,
  format: string,
): { width: number; height: number } {
  if (
    format === "image/png" &&
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (
    format === "image/webp" &&
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (
      chunk === "VP8 " &&
      buffer[23] === 0x9d &&
      buffer[24] === 0x01 &&
      buffer[25] === 0x2a
    ) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && buffer[20] === 0x2f) {
      return {
        width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
        height:
          1 +
          (buffer[22] >> 6) +
          (buffer[23] << 2) +
          ((buffer[24] & 0x0f) << 10),
      };
    }
  }
  throw new Error("Preview bytes do not match the declared PNG/WebP format");
}

export class CatalogPreviewService {
  constructor(
    private readonly db: PrismaClient,
    private readonly r2: R2Client,
  ) {}

  async upload(input: UploadCatalogPreviewInput) {
    const buffer = Buffer.from(input.body, "base64");
    if (!buffer.length || buffer.length > MAX_BYTES)
      throw new Error("Preview must be between 1 byte and 2 MiB");
    const dimensions = imageDimensions(buffer, input.format);
    if (
      dimensions.width < 1 ||
      dimensions.height < 1 ||
      dimensions.width > MAX_WIDTH ||
      dimensions.height > MAX_HEIGHT
    )
      throw new Error("Preview dimensions are outside the allowed range");

    const revision =
      input.resourceType === "EMAIL_TEMPLATE"
        ? await this.db.emailTemplate.findFirst({
            where: {
              id: input.resourceId,
              organizationId: input.organizationId,
              visibility: "CATALOG",
            },
            select: { contentRevision: true },
          })
        : await this.db.page.findFirst({
            where: {
              id: input.resourceId,
              organizationId: input.organizationId,
              visibility: "CATALOG",
            },
            select: { contentRevision: true },
          });
    if (!revision) throw new Error("Catalog resource not found");
    if (revision.contentRevision !== input.sourceRevision)
      throw new Error(
        "Preview is stale; regenerate it from the latest revision",
      );

    const extension = input.format === "image/png" ? "png" : "webp";
    const remoteId = `catalog-previews/${input.organizationId}/${input.resourceId}/${input.sourceRevision}-${randomUUID()}.${extension}`;
    await this.r2.uploadObject(remoteId, buffer, input.format);

    try {
      const result = await this.db.$transaction(async (tx) => {
        const currentRevision =
          input.resourceType === "EMAIL_TEMPLATE"
            ? await tx.emailTemplate.findFirst({
                where: {
                  id: input.resourceId,
                  organizationId: input.organizationId,
                  visibility: "CATALOG",
                },
                select: { contentRevision: true },
              })
            : await tx.page.findFirst({
                where: {
                  id: input.resourceId,
                  organizationId: input.organizationId,
                  visibility: "CATALOG",
                },
                select: { contentRevision: true },
              });
        if (currentRevision?.contentRevision !== input.sourceRevision)
          throw new Error(
            "Preview is stale; regenerate it from the latest revision",
          );

        const old = await tx.catalogPreview.findFirst({
          where:
            input.resourceType === "EMAIL_TEMPLATE"
              ? { emailTemplateId: input.resourceId }
              : { pageId: input.resourceId },
          include: { file: { include: { storedObject: true } } },
        });
        const storedObject = await tx.storedObject.create({
          data: {
            remoteId,
            size: buffer.length,
            format: input.format,
            organizationId: input.organizationId,
          },
        });
        const file = await tx.file.create({
          data: {
            storedObjectId: storedObject.id,
            name: `preview-${input.resourceId}.${extension}`,
            size: buffer.length,
            format: input.format,
            purpose: "CATALOG_PREVIEW",
            organizationId: input.organizationId,
            uploadedById: input.uploadedById,
          },
        });
        const preview = await tx.catalogPreview.upsert({
          where:
            input.resourceType === "EMAIL_TEMPLATE"
              ? { emailTemplateId: input.resourceId }
              : { pageId: input.resourceId },
          create: {
            organizationId: input.organizationId,
            emailTemplateId:
              input.resourceType === "EMAIL_TEMPLATE" ? input.resourceId : null,
            pageId: input.resourceType === "PAGE" ? input.resourceId : null,
            fileId: file.id,
            sourceRevision: input.sourceRevision,
            status: "READY",
          },
          update: {
            fileId: file.id,
            sourceRevision: input.sourceRevision,
            status: "READY",
            failureReason: null,
          },
        });
        if (old?.file) {
          await tx.file.delete({ where: { id: old.file.id } });
          const count = await tx.file.count({
            where: { storedObjectId: old.file.storedObjectId },
          });
          if (!count)
            await tx.storedObject.delete({
              where: { id: old.file.storedObjectId },
            });
        }
        return { preview, oldRemoteId: old?.file?.storedObject.remoteId };
      });
      if (result.oldRemoteId) await this.r2.deleteObject(result.oldRemoteId);
      return {
        id: result.preview.id,
        status: result.preview.status,
        sourceRevision: result.preview.sourceRevision,
        url: `/api/catalog-previews/${result.preview.id}`,
      };
    } catch (error) {
      await this.r2.deleteObject(remoteId);
      throw error;
    }
  }
}
