import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), "next-phish-sdk-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function run(command, args, cwd = temporary) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

try {
  const [packed] = JSON.parse(
    run(
      npm,
      ["pack", "--json", "--ignore-scripts", "--pack-destination", temporary],
      packageRoot,
    ),
  );
  assert.ok(packed.files.some(({ path }) => path === "dist/index.js"));
  assert.ok(
    packed.files.some(({ path }) => path === "dist/router.generated.d.ts"),
  );
  assert.ok(
    packed.files.every(
      ({ path }) =>
        path.startsWith("dist/") ||
        ["package.json", "README.md"].includes(path),
    ),
  );
  const manifest = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  assert.ok(
    Object.values(manifest.dependencies).every(
      (version) => !version.startsWith("workspace:"),
    ),
  );

  writeFileSync(
    join(temporary, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(npm, [
    "install",
    join(temporary, packed.filename),
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--package-lock=false",
  ]);
  writeFileSync(
    join(temporary, "consumer.ts"),
    `
import { createNextPhishClient, type ApiOutputs } from "@next-phish/sdk";
const client = createNextPhishClient({ baseUrl: "https://example.com", token: "pat" });
const campaigns: Promise<ApiOutputs["campaign"]["list"]> = client.campaign.list.query({ organizationId: "org" });
void campaigns;
// @ts-expect-error A campaign ID and enabled flag are required.
void client.campaign.setDeliveryEnabled.mutate({ organizationId: "org" });
`,
  );
  writeFileSync(
    join(temporary, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        types: [],
      },
      files: ["consumer.ts"],
    }),
  );
  run(process.execPath, [
    fileURLToPath(import.meta.resolve("typescript/bin/tsc")),
    "-p",
    join(temporary, "tsconfig.json"),
  ]);
  run(process.execPath, [
    "--input-type=module",
    "-e",
    `
    import { createNextPhishClient } from '@next-phish/sdk';
    const client = createNextPhishClient({ baseUrl: 'https://example.com', token: 'pat' });
    if (typeof client.campaign.list.query !== 'function') throw new Error('Invalid client');
  `,
  ]);
  console.log(
    "Packed SDK passed isolated runtime and TypeScript consumer checks.",
  );
} catch (error) {
  if (error.stdout) console.error(error.stdout);
  if (error.stderr) console.error(error.stderr);
  throw error;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
