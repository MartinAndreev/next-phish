export interface TrackedLink {
  linkId: string;
  destinationUrl: string;
}

export function rewriteTrackedLinks(
  html: string,
  publicContentUrl: string,
): { html: string; links: TrackedLink[] } {
  const host = publicContentUrl.replace(/\/$/, "");
  const destinations = new Map<string, string>();
  let nextId = 0;
  const rewritten = html.replace(
    /(<a\b[^>]*?\bhref\s*=\s*)(["'])(https?:\/\/[^"']+)\2/gi,
    (match, prefix: string, quote: string, rawUrl: string) => {
      let destination: string;
      try {
        const url = new URL(rawUrl.replace(/&amp;/g, "&"));
        if (url.protocol !== "http:" && url.protocol !== "https:") return match;
        destination = url.toString();
      } catch {
        return match;
      }
      let linkId = destinations.get(destination);
      if (!linkId) {
        linkId = (nextId += 1).toString(36).padStart(4, "0");
        destinations.set(destination, linkId);
      }
      return `${prefix}${quote}${host}/r/${linkId}?ref={{trackingRef}}${quote}`;
    },
  );
  return {
    html: rewritten,
    links: [...destinations].map(([destinationUrl, linkId]) => ({
      linkId,
      destinationUrl,
    })),
  };
}
