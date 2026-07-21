"use client";

import { useCallback } from "react";
import { ErrorMessage, Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import { TabPanel, TabView } from "primereact/tabview";
import type {
  CampaignFormValues,
  EmailTemplateListItemView,
  PageListItemView,
} from "@next-phish/shared";
import { FormMessage } from "@/src/components/atoms/form-message";
import type { CatalogPageState } from "@/src/hooks/use-campaign-catalog-state";
import { AssetCatalogTab } from "./asset-catalog-tab";
import { GeneralTab } from "./general-tab";
import { ScheduleTab } from "./schedule-tab";
import { SendingProfileTab } from "./sending-profile-tab";

interface CampaignFormPresentationProps {
  isEdit: boolean;
  emailTemplates: EmailTemplateListItemView[];
  emailTemplatesTotal: number;
  emailTemplatesLoading: boolean;
  emailTemplateCatalogState: CatalogPageState;
  setEmailTemplateSearch: (value: string) => void;
  setEmailTemplatePage: (offset: number, limit: number) => void;
  pages: PageListItemView[];
  pagesTotal: number;
  pagesLoading: boolean;
  pageCatalogState: CatalogPageState;
  setPageSearch: (value: string) => void;
  setPagePage: (offset: number, limit: number) => void;
  sendingProfiles: Array<{
    id: string;
    name: string;
    providerType?: string;
    fromEmail?: string;
  }>;
  sendingProfilesLoading: boolean;
  sendingProfileSearch: string;
  setSendingProfileSearch: (value: string) => void;
  targetGroups: Array<{ id: string; name: string; userCount: number }>;
  hasExistingSchedule: boolean;
  error: string;
  onCancel: () => void;
}

export function CampaignFormPresentation({
  isEdit,
  emailTemplates,
  emailTemplatesTotal,
  emailTemplatesLoading,
  emailTemplateCatalogState,
  setEmailTemplateSearch,
  setEmailTemplatePage,
  pages,
  pagesTotal,
  pagesLoading,
  pageCatalogState,
  setPageSearch,
  setPagePage,
  sendingProfiles,
  sendingProfilesLoading,
  sendingProfileSearch,
  setSendingProfileSearch,
  targetGroups,
  hasExistingSchedule,
  error,
  onCancel,
}: CampaignFormPresentationProps) {
  const { values, setFieldValue, isSubmitting } =
    useFormikContext<CampaignFormValues>();
  const recipientCount =
    targetGroups.find((group) => group.id === values.targetGroupId)
      ?.userCount ?? 0;
  const selectEmailTemplate = useCallback(
    (id: string) => void setFieldValue("emailTemplateId", id),
    [setFieldValue],
  );
  const selectPage = useCallback(
    (id: string) => void setFieldValue("pageId", id),
    [setFieldValue],
  );

  return (
    <Form className="space-y-6">
      <TabView>
        <TabPanel header="General" leftIcon="pi pi-sliders-h mr-2">
          <GeneralTab targetGroups={targetGroups} isEdit={isEdit} />
        </TabPanel>
        <TabPanel header="Email template" leftIcon="pi pi-envelope mr-2">
          <AssetCatalogTab
            title="Email template"
            description="Choose the message recipients receive. The current selection stays first while editing."
            searchPlaceholder="Search email templates"
            emptyMessage="No active email templates match this search."
            items={emailTemplates}
            total={emailTemplatesTotal}
            loading={emailTemplatesLoading}
            selectedId={values.emailTemplateId}
            search={emailTemplateCatalogState.input}
            offset={emailTemplateCatalogState.offset}
            limit={emailTemplateCatalogState.limit}
            onSearch={setEmailTemplateSearch}
            onPage={setEmailTemplatePage}
            onSelect={selectEmailTemplate}
          />
          <ErrorMessage
            name="emailTemplateId"
            component="p"
            className="mt-3 text-sm text-red-400"
          />
        </TabPanel>
        <TabPanel header="Landing page" leftIcon="pi pi-window-maximize mr-2">
          <AssetCatalogTab
            title="Landing page"
            description="Choose the destination shown after the recipient follows the campaign link."
            searchPlaceholder="Search landing pages"
            emptyMessage="No active landing pages match this search."
            items={pages}
            total={pagesTotal}
            loading={pagesLoading}
            selectedId={values.pageId}
            search={pageCatalogState.input}
            offset={pageCatalogState.offset}
            limit={pageCatalogState.limit}
            onSearch={setPageSearch}
            onPage={setPagePage}
            onSelect={selectPage}
          />
          <ErrorMessage
            name="pageId"
            component="p"
            className="mt-3 text-sm text-red-400"
          />
        </TabPanel>
        <TabPanel header="Sending profile" leftIcon="pi pi-send mr-2">
          <SendingProfileTab
            profiles={sendingProfiles}
            loading={sendingProfilesLoading}
            search={sendingProfileSearch}
            onSearch={setSendingProfileSearch}
          />
        </TabPanel>
        {values.type === "CONCRETE" ? (
          <TabPanel header="Schedule" leftIcon="pi pi-calendar mr-2">
            <ScheduleTab
              recipientCount={recipientCount}
              hasExistingSchedule={hasExistingSchedule}
            />
          </TabPanel>
        ) : null}
      </TabView>

      <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
        {error ? (
          <div className="mb-4">
            <FormMessage variant="error">{error}</FormMessage>
          </div>
        ) : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            size="small"
            outlined
            label="Cancel"
            onClick={onCancel}
          />
          <Button
            type="submit"
            size="small"
            label={
              values.status === "PUBLISHED"
                ? "Save and publish campaign"
                : "Save draft"
            }
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </section>
    </Form>
  );
}
