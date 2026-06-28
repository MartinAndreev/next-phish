import * as cheerio from "cheerio";
import type { ImportContext, ImportHandler } from "../types";

export class ParseAndNormalizeHandler implements ImportHandler {
  async handle(ctx: ImportContext, next: () => Promise<void>): Promise<void> {
    if (!ctx.html) {
      throw new Error("No HTML to parse");
    }

    ctx.$ = cheerio.load(ctx.html);

    const baseUrl = ctx.finalUrl || ctx.url;
    const hasBase = ctx.$("base").length > 0;

    if (!hasBase) {
      ctx.$("head").prepend(`<base href="${baseUrl}">`);
    }

    ctx.$("form").each((_: number, form: unknown) => {
      const $form = ctx.$(form as string);
      const action = $form.attr("action") || baseUrl;
      $form.prepend(
        `<input type="hidden" name="__original_url" value="${action}" />`,
      );
    });

    await next();
  }
}
