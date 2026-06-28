import { Hono } from "hono";
import { Container, SiteImportRepository, R2Client } from "@next-phish/backend";

const imports = new Hono();

imports.get("/api/imports/:importId/assets/:fileId/:fileName", async (c) => {
  const importId = c.req.param("importId");
  const fileId = c.req.param("fileId");

  const siteImportRepo = Container.get(SiteImportRepository);

  const importFile = await siteImportRepo.findFileById(fileId);
  if (!importFile || importFile.siteImportId !== importId) {
    return c.text("Not found", 404);
  }

  const r2 = new R2Client();
  const object = await r2.getObject(importFile.file.remoteId);
  if (!object) {
    return c.text("File not in storage", 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": importFile.file.format || object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

export { imports };
