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
import { MessageBus } from "./message-bus";

export function initializeContainer(): void {
  registerEmailServices();
  registerUserServices(db);
  registerOrganizationServices(db);
  registerEmailTemplateServices(db);
  registerFileServices(db);
  Container.set(MessageBus, new MessageBus(db));
}

export function registerAuth(
  auth: Parameters<typeof registerOrganizationAuth>[0],
): void {
  registerOrganizationAuth(auth);
}

export { Container };
