import { Container } from "typedi";
import { EncryptionService } from "./encryption.service";

export function registerEncryptionServices(encryptionKey: string): void {
  Container.set(EncryptionService, new EncryptionService(encryptionKey));
}
