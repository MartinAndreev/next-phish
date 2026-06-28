import type { SiteImportView, SiteImportFileView } from "../types";

export class SiteImportService {
  toView(row: SiteImportView): SiteImportView {
    return row;
  }

  toFileView(row: SiteImportFileView): SiteImportFileView {
    return row;
  }

  buildAssetUrl(
    siteImportId: string,
    fileId: string,
    fileName: string,
  ): string {
    return `/api/imports/${siteImportId}/assets/${fileId}/${fileName}`;
  }

  generateLocalPath(url: string): string {
    try {
      const parsed = new URL(url);
      let path = parsed.pathname.replace(/^\/+/, "");
      if (!path || path.endsWith("/")) {
        path += "index.html";
      }
      return path;
    } catch {
      return url.replace(/[^a-zA-Z0-9._-]/g, "_");
    }
  }

  generateRemoteId(
    organizationId: string,
    siteImportId: string,
    filename: string,
  ): string {
    return `${organizationId}/site-imports/${siteImportId}/${crypto.randomUUID()}-${filename}`;
  }
}
