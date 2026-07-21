import { ScheduleFormContainer } from "@/src/components/organisms/schedules/form-container";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { campaignId } = await searchParams;
  return <ScheduleFormContainer campaignId={campaignId} />;
}
