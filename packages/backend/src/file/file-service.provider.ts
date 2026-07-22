import { Container } from "typedi";
import type { PrismaClient } from "@next-phish/database";
import { R2Client } from "../storage/r2-client";
import { FileRepository } from "./repositories";
import { FileService } from "./services";
import { UploadFileCommand, DeleteFileCommand } from "./commands";
import { ListFilesQuery } from "./queries";
import { CatalogPreviewService } from "../catalog-preview";

export function registerFileServices(db: PrismaClient): void {
  const r2 = new R2Client();
  const fileRepo = new FileRepository(db);
  const fileService = new FileService();

  Container.set(R2Client, r2);
  Container.set(FileRepository, fileRepo);
  Container.set(FileService, fileService);
  Container.set(CatalogPreviewService, new CatalogPreviewService(db, r2));
  Container.set(
    UploadFileCommand,
    new UploadFileCommand(fileRepo, fileService, r2),
  );
  Container.set(DeleteFileCommand, new DeleteFileCommand(fileRepo, r2));
  Container.set(ListFilesQuery, new ListFilesQuery(fileRepo, fileService));
}
