import { CampaignFormContainer } from "@/src/components/organisms/campaigns/form-container";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CampaignFormContainer campaignId={id} />;
}
