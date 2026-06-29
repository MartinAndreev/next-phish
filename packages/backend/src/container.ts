import { Container } from "typedi";
import { db } from "@next-phish/database";
import { registerEmailServices } from "./email";
import { registerUserServices } from "./user";
import {
  registerOrganizationServices,
  registerOrganizationAuth,
} from "./organization";
import { registerEmailTemplateServices } from "./email-template";
import { registerFileServices } from "./file";
import { registerPageServices } from "./page";
import { registerJobServices } from "./job";
import { registerSiteImportServices } from "./site-import";
import { registerEncryptionServices } from "./encryption";
import { registerApiKeyServices, registerApiKeyAuth } from "./api-key";
import { MessageBus } from "./message-bus";

export interface ContainerOptions {
  encryptionKey: string;
}

export function initializeContainer(options: ContainerOptions): void {
  registerEncryptionServices(options.encryptionKey);
  registerEmailServices();
  registerUserServices(db);
  registerOrganizationServices(db);
  registerEmailTemplateServices(db);
  registerFileServices(db);
  registerPageServices(db);
  registerJobServices(db);
  registerSiteImportServices(db);
  registerApiKeyServices(db);
  Container.set(MessageBus, new MessageBus(db));
}

export function registerAuth(
  auth: Parameters<typeof registerOrganizationAuth>[0] & {
    api: Parameters<typeof registerApiKeyAuth>[0]["api"];
  },
): void {
  registerOrganizationAuth(auth);
  registerApiKeyAuth(auth);
}

export { Container };
