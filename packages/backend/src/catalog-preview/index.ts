import { z } from "zod";
export { CatalogPreviewService } from "./catalog-preview.service";
export type { UploadCatalogPreviewInput } from "./catalog-preview.service";

export const UploadCatalogPreviewSchema = z.object({
  resourceId: z.string().min(1),
  sourceRevision: z.number().int().positive(),
  format: z.enum(["image/png", "image/webp"]),
  body: z.string().min(1).max(2_800_000),
});
