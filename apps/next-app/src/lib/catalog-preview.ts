"use client";

import { toCanvas } from "html-to-image";

const WIDTH = 800;
const HEIGHT = 600;
const MAX_BYTES = 2 * 1024 * 1024;

const DUMMY_VALUES: Record<string, string> = {
  "{{.FirstName}}": "Alex",
  "{{.LastName}}": "Morgan",
  "{{.Email}}": "alex@example.invalid",
  "{{.Position}}": "Team member",
  "{{.URL}}": "https://example.invalid/training",
};

function sanitizeHtml(html: string): string {
  let rendered = html;
  for (const [token, value] of Object.entries(DUMMY_VALUES))
    rendered = rendered.split(token).join(value);

  const document = new DOMParser().parseFromString(rendered, "text/html");
  document
    .querySelectorAll(
      "script,iframe,object,embed,form,input,button,textarea,select,link,meta,base",
    )
    .forEach((node) => node.remove());
  for (const style of document.querySelectorAll("style")) {
    style.textContent = (style.textContent ?? "")
      .replace(/@import[^;]+;?/gi, "")
      .replace(/url\s*\([^)]*\)/gi, "none");
  }
  for (const element of document.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (
        name.startsWith("on") ||
        ["srcdoc", "srcset", "background", "action", "formaction"].includes(
          name,
        ) ||
        ((name === "src" || name === "href") &&
          !value.startsWith("data:image/") &&
          !value.startsWith("#"))
      )
        element.removeAttribute(attribute.name);
      if (name === "style" && /url\s*\(/i.test(attribute.value))
        element.removeAttribute("style");
    }
  }

  const styles = [...document.head.querySelectorAll("style")]
    .map((style) => style.outerHTML)
    .join("");
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src 'none'; connect-src 'none'; media-src 'none'; frame-src 'none'">${styles}</head><body>${document.body.innerHTML}</body></html>`;
}

function waitForFrame(frame: HTMLIFrameElement): Promise<Document> {
  return new Promise((resolve, reject) => {
    frame.addEventListener(
      "load",
      () => {
        if (frame.contentDocument) resolve(frame.contentDocument);
        else reject(new Error("Preview frame could not be loaded"));
      },
      { once: true },
    );
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Preview encoding failed")),
      "image/webp",
      0.82,
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(blob);
  });
}

export async function createCatalogPreview(input: {
  html: string;
  upload: (data: {
    resourceId: string;
    sourceRevision: number;
    format: "image/webp";
    body: string;
  }) => Promise<unknown>;
  resourceId: string;
  sourceRevision: number;
}): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("sandbox", "allow-same-origin");
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    border: "0",
    pointerEvents: "none",
  });
  const loaded = waitForFrame(frame);
  frame.srcdoc = sanitizeHtml(input.html);
  document.body.appendChild(frame);
  try {
    const previewDocument = await loaded;
    const canvas = await toCanvas(previewDocument.body, {
      width: WIDTH,
      height: HEIGHT,
      canvasWidth: WIDTH,
      canvasHeight: HEIGHT,
      pixelRatio: 1,
      cacheBust: false,
      backgroundColor: "#ffffff",
    });
    const blob = await canvasBlob(canvas);
    if (blob.size > MAX_BYTES)
      throw new Error("Generated preview is too large");
    await input.upload({
      resourceId: input.resourceId,
      sourceRevision: input.sourceRevision,
      format: "image/webp",
      body: await blobToBase64(blob),
    });
  } finally {
    frame.remove();
  }
}
