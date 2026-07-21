import { NextResponse } from "next/server";
import { db } from "@next-phish/database";
import { Container } from "@/src/server/container";
import { auth } from "@/src/server/auth";
import { R2Client } from "@next-phish/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ previewId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const activeOrganizationId = (
    session.session as typeof session.session & {
      activeOrganizationId?: string | null;
    }
  ).activeOrganizationId;
  if (!activeOrganizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { previewId } = await params;
  const preview = await db.catalogPreview.findFirst({
    where: {
      id: previewId,
      organizationId: activeOrganizationId,
      status: "READY",
    },
    include: { file: { include: { storedObject: true } } },
  });
  if (!preview?.file)
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });

  const permissions: Record<string, string[]> = preview.emailTemplateId
    ? { "email-templates": ["read"] }
    : { pages: ["read"] };
  const permitted = await auth.api.hasPermission({
    headers: request.headers,
    body: {
      organizationId: activeOrganizationId,
      permissions,
    },
  });
  if (!permitted)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const object = await Container.get(R2Client).getObject(
    preview.file.storedObject.remoteId,
  );
  if (!object)
    return NextResponse.json(
      { error: "Preview object not found" },
      { status: 404 },
    );

  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": preview.file.format,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
