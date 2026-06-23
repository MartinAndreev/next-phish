import type { ICommandHandler } from "../../message-bus";
import { PageRepository } from "../repositories";
import { EncryptionService } from "../../encryption";
import type { CreatePageSubmissionData } from "../types";

export class CreatePageSubmissionCommand implements ICommandHandler<
  CreatePageSubmissionData,
  { id: string }
> {
  constructor(
    private readonly pageRepo: PageRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(data: CreatePageSubmissionData): Promise<{ id: string }> {
    const page = await this.pageRepo.findByPublicId(data.pageId);

    if (!page) {
      throw new Error("Page not found");
    }

    if (!page.captureData) {
      throw new Error("This page does not capture submissions");
    }

    const encrypted = this.encryptionService.encrypt(data.data);

    const id = await this.pageRepo.createSubmission({
      pageId: data.pageId,
      encryptedData: encrypted,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return { id };
  }
}
