import { CampaignDetailContainer } from "@/src/components/organisms/campaigns/detail-container";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  return <CampaignDetailContainer id={id} saved={saved} />;
}
