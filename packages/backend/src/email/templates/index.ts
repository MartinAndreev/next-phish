import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import ejs from "ejs";

function findTemplatesDir(): string {
  // In dev (ts-node / tsx), __dirname points to the source directory.
  const sourceDir = __dirname;
  if (existsSync(join(sourceDir, "layout.ejs"))) {
    return sourceDir;
  }

  // When bundled (Next.js), __dirname may not reflect the real filesystem.
  // Try relative to cwd, assuming cwd = <repo>/apps/next-app.
  const fromCwd = resolve(
    process.cwd(),
    "../../packages/backend/src/email/templates",
  );
  if (existsSync(join(fromCwd, "layout.ejs"))) {
    return fromCwd;
  }

  throw new Error(
    `Cannot find email templates directory. Tried:\n  ${sourceDir}\n  ${fromCwd}`,
  );
}

const templatesDir = findTemplatesDir();

const cache = new Map<string, string>();

function loadTemplate(name: string): string {
  if (!cache.has(name)) {
    cache.set(name, readFileSync(join(templatesDir, `${name}.ejs`), "utf-8"));
  }
  return cache.get(name)!;
}

export function renderTemplate(
  name: string,
  locals: Record<string, unknown> = {},
): string {
  const layout = loadTemplate("layout");
  const content = ejs.render(loadTemplate(name), {
    ...locals,
    appUrl: process.env.APP_URL,
  });
  return ejs.render(layout, {
    ...locals,
    body: content,
    appUrl: process.env.APP_URL,
  });
}
