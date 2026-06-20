import { getRequiredSession } from "@/src/server/get-required-session";

// Auth is resolved in this layout, so the whole authenticated app segment must stay dynamic.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getRequiredSession();

  return children;
}
