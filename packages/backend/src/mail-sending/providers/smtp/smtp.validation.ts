import type { SMTPProviderConfig } from "./smtp.config";

export interface ParsedHost {
  host: string;
  port?: number;
}

export function parseHostPort(hostString: string): ParsedHost {
  const colonIndex = hostString.lastIndexOf(":");

  if (colonIndex === -1 || colonIndex === 0) {
    return { host: hostString };
  }

  const host = hostString.substring(0, colonIndex);
  const portStr = hostString.substring(colonIndex + 1);

  if (!portStr) {
    return { host };
  }

  const port = parseInt(portStr, 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    return { host: hostString };
  }

  return { host, port };
}

export function resolvePort(config: SMTPProviderConfig): number {
  if (config.port) return config.port;

  if (config.secure) return 465;

  return 587;
}
