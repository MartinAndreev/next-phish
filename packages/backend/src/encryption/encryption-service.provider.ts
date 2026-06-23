import { Container } from "typedi";
import { EncryptionService } from "./encryption.service";

export function registerEncryptionServices(): void {
  Container.set(EncryptionService, new EncryptionService());
}
