import { FileRepository } from "../repositories";
import { FileService } from "../services";
import type { FileView } from "../types";
import type { IQueryHandler } from "../../message-bus";
import type { FilePurpose } from "@prisma/client";

interface ListFilesInput {
  purpose?: FilePurpose;
  emailTemplateId?: string;
}

export class ListFilesQuery implements IQueryHandler<
  ListFilesInput,
  FileView[]
> {
  constructor(
    private readonly fileRepo: FileRepository,
    private readonly fileService: FileService,
  ) {}

  async execute(input: ListFilesInput): Promise<FileView[]> {
    const rows = input.emailTemplateId
      ? await this.fileRepo.findByEmailTemplateId(input.emailTemplateId)
      : input.purpose
        ? await this.fileRepo.findByPurpose(input.purpose)
        : [];

    return this.fileService.toViews(rows);
  }
}
