import { SiteImportRepository } from "../repositories";
import { R2Client } from "../../storage/r2-client";
import { FileRepository } from "../../file/repositories";
import type { ICommandHandler } from "../../message-bus";

interface CleanupExpiredImportsData {
  olderThanHours?: number;
}

export class CleanupExpiredImportsCommand implements ICommandHandler<
  CleanupExpiredImportsData,
  number
> {
  constructor(
    private readonly siteImportRepo: SiteImportRepository,
    private readonly fileRepo: FileRepository,
    private readonly r2: R2Client,
  ) {}

  async execute(data: CleanupExpiredImportsData): Promise<number> {
    const hours = data.olderThanHours ?? 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const expired = await this.siteImportRepo.findExpiredUnreferenced(cutoff);

    let deleted = 0;
    for (const siteImport of expired) {
      for (const file of siteImport.files) {
        try {
          const result = await this.fileRepo.delete(file.fileId);
          if (result.orphanedRemoteId) {
            await this.r2.deleteObject(result.orphanedRemoteId);
          }
        } catch {
          // ignore storage cleanup errors
        }
      }
      await this.siteImportRepo.delete(siteImport.id);
      deleted++;
    }

    return deleted;
  }
}
