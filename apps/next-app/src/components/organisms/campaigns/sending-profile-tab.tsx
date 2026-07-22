"use client";

import { ErrorMessage, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Skeleton } from "primereact/skeleton";
import type { CampaignFormValues } from "@next-phish/shared";

interface SendingProfileTabProps {
  profiles: Array<{
    id: string;
    name: string;
    providerType?: string;
    fromEmail?: string;
  }>;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
}

export function SendingProfileTab({
  profiles,
  loading,
  search,
  onSearch,
}: SendingProfileTabProps) {
  const { values, setFieldValue } = useFormikContext<CampaignFormValues>();

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Sending profile</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Choose the organization profile used to deliver this campaign.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <i className="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-zinc-400" />
          <InputText
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search sending profiles"
            aria-label="Search sending profiles"
            pt={{
              root: {
                className: "w-full py-2 pl-9 pr-3 text-xs",
              },
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height="7rem" borderRadius="0.75rem" />
          ))}
        </div>
      ) : profiles.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => {
            const selected = profile.id === values.mailSendingProfileId;
            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  void setFieldValue("mailSendingProfileId", profile.id)
                }
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-brand-blue bg-brand-blue/10 ring-2 ring-brand-blue/20"
                    : "border-white/10 bg-brand-navy/40 hover:border-brand-blue/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {profile.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {profile.providerType?.replaceAll("_", " ") ??
                        "Sending profile"}
                    </p>
                    {profile.fromEmail ? (
                      <p className="mt-2 truncate text-xs text-zinc-500">
                        {profile.fromEmail}
                      </p>
                    ) : null}
                  </div>
                  {selected ? (
                    <i
                      className="pi pi-check-circle text-brand-cyan"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-zinc-400">
          {search
            ? "No sending profiles match this search."
            : "No sending profiles are available."}
        </p>
      )}

      <ErrorMessage
        name="mailSendingProfileId"
        component="p"
        className="mt-3 text-sm text-red-400"
      />
    </section>
  );
}
