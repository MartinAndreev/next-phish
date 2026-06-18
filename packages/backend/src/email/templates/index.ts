import { readFileSync } from "fs";
import { join } from "path";
import ejs from "ejs";

const templatesDir = join(__dirname);

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
