import { Container } from "typedi";
import { registerEmailServices } from "./email";

export function initializeContainer(): void {
  registerEmailServices();
}

export { Container };
