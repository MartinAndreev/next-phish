import { R2Client } from "../../storage/r2-client";
import { FileRepository } from "../repositories";
import type { ICommandHandler } from "../../message-bus";

interface DeleteFileInput {
  id: string;
}

export class DeleteFileCommand implements ICommandHandler<
  DeleteFileInput,
  boolean
> {
  constructor(
    private readonly fileRepo: FileRepository,
    private readonly r2: R2Client,
  ) {}

  async execute(data: DeleteFileInput): Promise<boolean> {
    const file = await this.fileRepo.findById(data.id);

    if (!file) {
      return false;
    }

    await this.r2.deleteObject(file.remoteId);
    return this.fileRepo.delete(data.id);
  }
}
