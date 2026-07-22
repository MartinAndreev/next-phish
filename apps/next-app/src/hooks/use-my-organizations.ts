"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/src/lib/trpc";
import { authClient } from "@/src/lib/auth-client";
import type { OrganizationView } from "@next-phish/backend";

interface UseMyOrganizationsOptions {
  search?: string;
  limit?: number;
  offset?: number;
  initialData?: {
    organizations: OrganizationView[];
    total: number;
  };
}

export function useMyOrganizations(options: UseMyOrganizationsOptions = {}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.organization.list.useQuery(
    {
      search: options.search,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    },
    {
      initialData: options.initialData,
      staleTime: options.initialData ? 5 * 60 * 1000 : undefined,
    },
  );

  const { data: activeOrg } = authClient.useActiveOrganization();

  const create = trpc.organization.create.useMutation({
    onSuccess: () => {
      utils.organization.list.invalidate();
    },
  });

  async function setActive(organizationId: string) {
    await authClient.organization.setActive({ organizationId });
    router.refresh();
  }

  return {
    organizations: data?.organizations ?? [],
    total: data?.total ?? 0,
    isLoading,
    activeOrg,
    create,
    setActive,
  };
}
