import { isIP } from "node:net";

export interface NormalizedNetwork {
  family: 4 | 6;
  address: bigint;
  prefix: number;
  canonical: string;
}

function stripAddressDecorations(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    return end > 0 ? trimmed.slice(1, end) : trimmed;
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(trimmed))
    return trimmed.replace(/:\d+$/, "");
  const zone = trimmed.indexOf("%");
  return zone >= 0 ? trimmed.slice(0, zone) : trimmed;
}

function ipv4ToBigInt(value: string): bigint {
  return value
    .split(".")
    .reduce(
      (total, octet) => (total << BigInt(8)) + BigInt(Number(octet)),
      BigInt(0),
    );
}

function ipv6ToBigInt(value: string): bigint {
  const mapped = value.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4ToBigInt(mapped[1]!);
  const [leftRaw, rightRaw] = value.toLowerCase().split("::");
  const parseSide = (side: string | undefined) =>
    side ? side.split(":").filter(Boolean) : [];
  const left = parseSide(leftRaw);
  const right = parseSide(rightRaw);
  const missing = 8 - left.length - right.length;
  const groups = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];
  if (groups.length !== 8) throw new Error("Invalid IPv6 address");
  return groups.reduce(
    (total, group) => (total << BigInt(16)) + BigInt(`0x${group}`),
    BigInt(0),
  );
}

function bigintToIpv4(value: bigint): string {
  return [24, 16, 8, 0]
    .map((shift) => Number((value >> BigInt(shift)) & BigInt(255)))
    .join(".");
}

function bigintToIpv6(value: bigint): string {
  const groups = Array.from({ length: 8 }, (_, index) =>
    Number((value >> BigInt((7 - index) * 16)) & BigInt(0xffff)).toString(16),
  );
  let bestStart = -1;
  let bestLength = 0;
  for (let start = 0; start < groups.length; start += 1) {
    if (groups[start] !== "0") continue;
    let end = start;
    while (end < groups.length && groups[end] === "0") end += 1;
    if (end - start > bestLength && end - start >= 2) {
      bestStart = start;
      bestLength = end - start;
    }
    start = end - 1;
  }
  if (bestStart < 0) return groups.join(":");
  const before = groups.slice(0, bestStart).join(":");
  const after = groups.slice(bestStart + bestLength).join(":");
  return `${before}::${after}`;
}

export function normalizeNetwork(value: string): NormalizedNetwork {
  const [rawAddress, rawPrefix] = value.trim().split("/");
  const address = stripAddressDecorations(rawAddress ?? "");
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  const family = (mapped ? 4 : isIP(address)) as 0 | 4 | 6;
  if (!family) throw new Error("Invalid IP address or CIDR range");
  const maxPrefix = family === 4 ? 32 : 128;
  const prefix = rawPrefix === undefined ? maxPrefix : Number(rawPrefix);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix)
    throw new Error("Invalid CIDR prefix");
  const numeric =
    family === 4 ? ipv4ToBigInt(mapped?.[1] ?? address) : ipv6ToBigInt(address);
  const hostBits = BigInt(maxPrefix - prefix);
  const network =
    hostBits === BigInt(0) ? numeric : (numeric >> hostBits) << hostBits;
  const canonicalAddress =
    family === 4 ? bigintToIpv4(network) : bigintToIpv6(network);
  return {
    family,
    address: network,
    prefix,
    canonical: `${canonicalAddress}/${prefix}`,
  };
}

export function networkContains(network: string, address: string): boolean {
  const range = normalizeNetwork(network);
  const candidate = normalizeNetwork(address);
  if (range.family !== candidate.family) return false;
  const bits = BigInt((range.family === 4 ? 32 : 128) - range.prefix);
  return candidate.address >> bits === range.address >> bits;
}

export function resolveClientIp(input: {
  directAddress: string;
  forwardedFor?: string | null;
  trustedProxyNetworks: string[];
}): string {
  const direct = normalizeNetwork(input.directAddress).canonical.replace(
    /\/(32|128)$/,
    "",
  );
  const trusted = input.trustedProxyNetworks.some((network) =>
    networkContains(network, direct),
  );
  if (!trusted || !input.forwardedFor) return direct;

  const chain = input.forwardedFor
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  // Walk from the nearest proxy toward the client and stop at the first
  // untrusted address. The leftmost value is used only if every hop is trusted.
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const address = normalizeNetwork(chain[index]!).canonical.replace(
      /\/(32|128)$/,
      "",
    );
    if (
      !input.trustedProxyNetworks.some((network) =>
        networkContains(network, address),
      )
    )
      return address;
  }
  return normalizeNetwork(chain[0]!).canonical.replace(/\/(32|128)$/, "");
}
