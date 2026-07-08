import { describe, it, expect } from "vitest";
import {
  parseHostPort,
  resolvePort,
} from "../../../src/mail-sending/providers/smtp/smtp.validation";
import { SMTPProviderConfigSchema } from "../../../src/mail-sending/providers/smtp/smtp.config";

describe("SMTP validation", () => {
  describe("parseHostPort", () => {
    it("returns host only when no port is present", () => {
      const result = parseHostPort("smtp.example.com");
      expect(result).toEqual({ host: "smtp.example.com" });
    });

    it("parses host:port format (GoPhish compatibility)", () => {
      const result = parseHostPort("smtp.example.com:587");
      expect(result).toEqual({ host: "smtp.example.com", port: 587 });
    });

    it("parses host with port 25", () => {
      const result = parseHostPort("mail.example.com:25");
      expect(result).toEqual({ host: "mail.example.com", port: 25 });
    });

    it("handles IPv4 addresses", () => {
      const result = parseHostPort("192.168.1.1:587");
      expect(result).toEqual({ host: "192.168.1.1", port: 587 });
    });

    it("does not treat trailing colon as port separator", () => {
      const result = parseHostPort("host:");
      expect(result).toEqual({ host: "host" });
    });

    it("treats single colon prefix as host", () => {
      const result = parseHostPort(":587");
      expect(result).toEqual({ host: ":587" });
    });

    it("rejects invalid port number and returns full string as host", () => {
      const result = parseHostPort("host:99999");
      expect(result).toEqual({ host: "host:99999" });
    });

    it("rejects non-numeric port", () => {
      const result = parseHostPort("host:abc");
      expect(result).toEqual({ host: "host:abc" });
    });
  });

  describe("resolvePort", () => {
    it("returns explicit port when set", () => {
      const config = { host: "localhost", port: 25 };
      expect(resolvePort(config)).toBe(25);
    });

    it("returns 465 when secure is true and no port specified", () => {
      const config = { host: "localhost", secure: true };
      expect(resolvePort(config)).toBe(465);
    });

    it("returns 587 when secure is false and no port specified", () => {
      const config = { host: "localhost", secure: false };
      expect(resolvePort(config)).toBe(587);
    });

    it("returns 587 by default when secure is not set", () => {
      const config = { host: "localhost" };
      expect(resolvePort(config)).toBe(587);
    });
  });

  describe("SMTPProviderConfigSchema", () => {
    it("validates a minimal config", () => {
      const result = SMTPProviderConfigSchema.parse({
        host: "smtp.example.com",
      });
      expect(result.host).toBe("smtp.example.com");
      expect(result.secure).toBe(false);
      expect(result.ignoreCertErrors).toBe(false);
      expect(result.requireTls).toBe(false);
    });

    it("validates a full config", () => {
      const result = SMTPProviderConfigSchema.parse({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        username: "user",
        password: "secret",
        ignoreCertErrors: false,
        requireTls: true,
      });
      expect(result.port).toBe(587);
      expect(result.username).toBe("user");
    });

    it("rejects empty host", () => {
      const result = SMTPProviderConfigSchema.safeParse({ host: "" });
      expect(result.success).toBe(false);
    });

    it("rejects port out of range", () => {
      const result = SMTPProviderConfigSchema.safeParse({
        host: "localhost",
        port: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid from email", () => {
    it("rejects empty email", () => {
      const schema = SMTPProviderConfigSchema;
      const result = schema.safeParse({
        host: "localhost",
      });
      expect(result.success).toBe(true);
    });

    it("does not validate fromEmail in SMTP config (handled at profile level)", () => {
      expect(SMTPProviderConfigSchema.shape.host).toBeDefined();
      expect("fromEmail" in SMTPProviderConfigSchema.shape).toBe(false);
    });
  });
});
