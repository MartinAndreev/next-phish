import type { ImportContext, ImportHandler } from "../types";

export class ImportChainService {
  constructor(
    private readonly fetchHtml: ImportHandler,
    private readonly parseHtml: ImportHandler,
    private readonly discoverAssets: ImportHandler,
    private readonly downloadAssets: ImportHandler,
    private readonly rewriteReferences: ImportHandler,
    private readonly finalize: ImportHandler,
  ) {}

  async run(ctx: ImportContext): Promise<void> {
    const handlers: ImportHandler[] = [
      this.fetchHtml,
      this.parseHtml,
      ...(ctx.includeAssets
        ? [this.discoverAssets, this.downloadAssets, this.rewriteReferences]
        : []),
      this.finalize,
    ];

    let index = 0;

    const next = async (): Promise<void> => {
      const handler = handlers[index++];
      if (handler) {
        await handler.handle(ctx, next);
      }
    };

    await next();
  }
}
