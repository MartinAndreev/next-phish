import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export interface EncryptedPayload {
  iv: string;
  tag: string;
  ciphertext: string;
}

export class EncryptionService {
  private key: Buffer;

  constructor(keyHex?: string) {
    const hex = keyHex ?? process.env.PAGE_SUBMISSION_ENCRYPTION_KEY;
    if (!hex) {
      throw new Error(
        "PAGE_SUBMISSION_ENCRYPTION_KEY environment variable is not set. Must be a 64-character hex string (256-bit key).",
      );
    }
    this.key = Buffer.from(hex, "hex");
    if (this.key.length !== 32) {
      throw new Error(
        "PAGE_SUBMISSION_ENCRYPTION_KEY must be a 64-character hex string representing a 256-bit key.",
      );
    }
  }

  encrypt(data: Record<string, unknown>): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const json = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(json, "utf-8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      ciphertext: encrypted.toString("hex"),
    };
  }

  decrypt(payload: EncryptedPayload): Record<string, unknown> {
    const iv = Buffer.from(payload.iv, "hex");
    const tag = Buffer.from(payload.tag, "hex");
    const encrypted = Buffer.from(payload.ciphertext, "hex");

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf-8"));
  }
}
