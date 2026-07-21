"use client";

import { useCampaignCatalogState } from "@/src/hooks/use-campaign-catalog-state";
import { trpc } from "@/src/lib/trpc";

export function useCampaignAuthoring(campaignId?: string) {
  const utils = trpc.useUtils();
  const catalogs = useCampaignCatalogState();
  const campaign = trpc.campaign.getById.useQuery(
    { id: campaignId ?? "" },
    { enabled: Boolean(campaignId) },
  );
  const emailState = catalogs.state.emailTemplates;
  const pageState = catalogs.state.pages;
  const sendingProfileState = catalogs.state.sendingProfiles;
  const emailTemplates = trpc.emailTemplate.list.useQuery({
    search: emailState.search || undefined,
    selectedId: campaign.data?.emailTemplateId ?? undefined,
    includeContent: true,
    limit: emailState.limit,
    offset: emailState.offset,
    filters: { status: "ACTIVE" },
  });
  const pages = trpc.page.list.useQuery({
    search: pageState.search || undefined,
    selectedId: campaign.data?.pageId ?? undefined,
    includeContent: true,
    limit: pageState.limit,
    offset: pageState.offset,
    filters: { status: "ACTIVE", type: "LANDING" },
  });
  const sendingProfiles = trpc.mailSending.list.useQuery({
    search: sendingProfileState.search || undefined,
    limit: sendingProfileState.limit,
    offset: sendingProfileState.offset,
  });
  const targetGroups = trpc.targetGroup.list.useQuery({
    limit: 100,
    offset: 0,
    filters: { status: "ACTIVE" },
  });
  const create = trpc.campaign.create.useMutation({
    onSuccess: () => utils.campaign.list.invalidate(),
  });
  const update = trpc.campaign.update.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.campaign.list.invalidate(),
        campaignId
          ? utils.campaign.getById.invalidate({ id: campaignId })
          : Promise.resolve(),
      ]),
  });
  const createSchedule = trpc.campaign.createSchedule.useMutation({
    onSuccess: () => utils.campaign.listSchedules.invalidate(),
  });
  const updateSchedule = trpc.campaign.updateSchedule.useMutation({
    onSuccess: () => utils.campaign.listSchedules.invalidate(),
  });

  return {
    campaign,
    emailTemplates: emailTemplates.data?.emailTemplates ?? [],
    emailTemplatesTotal: emailTemplates.data?.total ?? 0,
    emailTemplatesLoading: emailTemplates.isLoading,
    emailTemplateCatalogState: emailState,
    setEmailTemplateSearch: (value: string) =>
      catalogs.setSearch("emailTemplates", value),
    setEmailTemplatePage: (offset: number, limit: number) =>
      catalogs.setPage("emailTemplates", offset, limit),
    pages: pages.data?.pages ?? [],
    pagesTotal: pages.data?.total ?? 0,
    pagesLoading: pages.isLoading,
    pageCatalogState: pageState,
    setPageSearch: (value: string) => catalogs.setSearch("pages", value),
    setPagePage: (offset: number, limit: number) =>
      catalogs.setPage("pages", offset, limit),
    sendingProfiles: sendingProfiles.data?.profiles ?? [],
    sendingProfilesLoading: sendingProfiles.isLoading,
    sendingProfileSearch: sendingProfileState.input,
    setSendingProfileSearch: (value: string) =>
      catalogs.setSearch("sendingProfiles", value),
    targetGroups: targetGroups.data?.targetGroups ?? [],
    // Catalog queries render their own skeletons. Excluding them here prevents
    // a search refetch from unmounting the entire form and resetting its tab.
    isLoading: campaign.isLoading || targetGroups.isLoading,
    create,
    update,
    createSchedule,
    updateSchedule,
  };
}

export function useSchedules() {
  const utils = trpc.useUtils();
  const list = trpc.campaign.listSchedules.useQuery({ limit: 100, offset: 0 });
  const cancel = trpc.campaign.cancelSchedule.useMutation({
    onSuccess: () => utils.campaign.listSchedules.invalidate(),
  });
  const duplicate = trpc.campaign.duplicateSchedule.useMutation({
    onSuccess: () => utils.campaign.listSchedules.invalidate(),
  });
  return { ...list, cancel, duplicate };
}
