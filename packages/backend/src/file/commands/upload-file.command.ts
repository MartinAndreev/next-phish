import { R2Client } from "../../storage/r2-client";
import { FileRepository } from "../repositories";
import { FileService } from "../services";
import type { FileView, UploadFileData } from "../types";
import type { ICommandHandler } from "../../message-bus";

export class UploadFileCommand implements ICommandHandler<
  UploadFileData,
  FileView
> {
  constructor(
    private readonly fileRepo: FileRepository,
    private readonly fileService: FileService,
    private readonly r2: R2Client,
  ) {}

  async execute(data: UploadFileData) {
    const buffer = Buffer.from(data.body, "base64");
    await this.r2.uploadObject(data.remoteId, buffer, data.format);

    const row = await this.fileRepo.create({
      remoteId: data.remoteId,
      name: data.name,
      size: data.size,
      format: data.format,
      purpose: data.purpose,
      uploadedById: data.uploadedById,
    });

    return this.fileService.toView(row);
  }
}
