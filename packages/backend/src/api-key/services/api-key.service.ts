import type { PrismaClient } from "@prisma/client";

function parseMetadata(metadata: unknown): Record<string, unknown> | null {
  if (metadata == null) return null;
  if (typeof metadata === "object") return metadata as Record<string, unknown>;
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      if (typeof parsed === "string") {
        return JSON.parse(parsed);
      }
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

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
      const metadata = parseMetadata(key.metadata);
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
        const updatedMetadata = {
          ...metadata,
          organizations: updatedOrgIds,
        };
        await this.db.apikey.update({
          where: { id: key.id },
          data: {
            metadata: JSON.stringify(updatedMetadata),
          },
        });
      }
    }
  }
}
