import { NextResponse } from "next/server";
import { Container } from "@/src/server/container";
import { SiteImportRepository, R2Client } from "@next-phish/backend";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ importId: string; fileId: string; fileName: string }>;
  },
) {
  const { importId, fileId } = await params;

  const siteImportRepo = Container.get(SiteImportRepository);

  const siteImport = await siteImportRepo.findById(importId);
  if (!siteImport) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  const importFile = await siteImportRepo.findFileById(fileId);
  if (!importFile || importFile.siteImportId !== importId) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const r2 = new R2Client();
  const object = await r2.getObject(importFile.file.remoteId);
  if (!object) {
    return NextResponse.json({ error: "File not in storage" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": importFile.file.format || object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
