import { ScheduleFormContainer } from "@/src/components/organisms/schedules/form-container";

export const dynamic = "force-dynamic";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScheduleFormContainer scheduleId={id} />;
}
