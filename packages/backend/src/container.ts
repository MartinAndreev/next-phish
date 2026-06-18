import { Container } from "typedi";
import { db } from "@next-phish/database";
import { registerEmailServices } from "./email";
import { registerUserServices } from "./user";
import { MessageBus } from "./message-bus";

export function initializeContainer(): void {
  registerEmailServices();
  registerUserServices(db);
  Container.set(MessageBus, new MessageBus(db));
}

export { Container };
