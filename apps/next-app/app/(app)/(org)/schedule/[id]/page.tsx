import { ScheduleDetailContainer } from "@/src/components/organisms/schedules/detail-container";

export default async function ScheduleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  return <ScheduleDetailContainer id={id} saved={saved} />;
}
