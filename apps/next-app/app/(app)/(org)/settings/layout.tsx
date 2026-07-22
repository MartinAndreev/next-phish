import { redirect } from "next/navigation";
import { db } from "@next-phish/database";
import { getRequiredSession } from "@/src/server/get-required-session";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getRequiredSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") redirect("/");
  return children;
}
