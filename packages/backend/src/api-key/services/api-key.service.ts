import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export class ApiKeyService {
  constructor(private readonly db: PrismaClient) {}

  async revokeOrgAccess(userId: string, organizationId: string): Promise<void> {
    const apiKeys = await this.db.apikey.findMany({
      where: {
        referenceId: userId,
        enabled: true,
      },
    });

    for (const key of apiKeys) {
      const metadata = key.metadata as Record<string, unknown> | null;
      const orgIds = metadata?.organizations as string[] | undefined;

      if (!orgIds || orgIds.length === 0) {
        continue;
      }

      const updatedOrgIds = orgIds.filter(
        (id: string) => id !== organizationId,
      );

      if (updatedOrgIds.length === 0) {
        await this.db.apikey.update({
          where: { id: key.id },
          data: { enabled: false },
        });
      } else {
        const updatedMetadata: Prisma.InputJsonValue = {
          ...metadata,
          organizations: updatedOrgIds,
        };
        await this.db.apikey.update({
          where: { id: key.id },
          data: {
            metadata: updatedMetadata,
          },
        });
      }
    }
  }
}
