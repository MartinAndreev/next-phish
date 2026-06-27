"use client";

import { useRef } from "react";
import grapesjs, { type Editor } from "grapesjs";
import GjsEditor from "@grapesjs/react";
import newsletterPreset from "grapesjs-preset-newsletter";
import blocksBasic from "grapesjs-blocks-basic";
import blocksFlexbox from "grapesjs-blocks-flexbox";
import pluginForms from "grapesjs-plugin-forms";
import styleGradient from "grapesjs-style-gradient";
import grapesjsFonts from "@silexlabs/grapesjs-fonts";

export type EditorMode = "email" | "page";

interface GrapesEditorProps {
  mode: EditorMode;
  initialDesign?: unknown;
  onChange: (value: { html: string; design: unknown }) => void;
  onEditor?: (editor: Editor) => void;
  fontsApiKey?: string;
}

function buildHtml(editor: Editor) {
  const css = editor.getCss();
  const body = editor.getHtml();
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${css}</style></head><body>${body}</body></html>`;
}

const emailDefaultContent = `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:40px;background:linear-gradient(135deg,#15e5d4 0%,#29b8ff 35%,#3b8fff 60%,#5c73ff 80%,#7b5cff 100%);color:#ffffff;">
              <h1 style="margin:0;font-size:28px;line-height:1.2;">Security Update</h1>
              <p style="margin:16px 0 0;font-size:16px;line-height:1.6;">Hello {{.FirstName}}, this is your starting point for a new phishing simulation email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;color:#0f172a;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We noticed activity that requires your attention. Review the link below and confirm your details.</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;">Email: {{.Email}}</p>
              <a href="{{.URL}}" style="display:inline-block;background:#29b8ff;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;">Review activity</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const pageDefaultContent = `
  <div style="padding:48px;font-family:system-ui,-apple-system,sans-serif;max-width:960px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#15e5d4 0%,#29b8ff 35%,#3b8fff 60%,#5c73ff 80%,#7b5cff 100%);border-radius:16px;padding:64px 48px;color:#ffffff;text-align:center;">
      <h1 style="margin:0 0 16px;font-size:36px;line-height:1.2;font-weight:700;">Welcome to NextPhish</h1>
      <p style="margin:0;font-size:18px;line-height:1.6;opacity:0.9;">Start building your page here.</p>
    </div>
  </div>
`;

function getPluginsConfig(mode: EditorMode, fontsApiKey?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginsOpts: Record<string, any> = {};

  plugins.push(newsletterPreset);
  pluginsOpts[newsletterPreset as unknown as string] = {
    showBlocksOnLoad: true,
    showStylesOnChange: true,
  };

  plugins.push(styleGradient);
  plugins.push(blocksBasic);

  if (mode === "email") {
    plugins.push(pluginForms);
  } else {
    plugins.push(blocksFlexbox);
    plugins.push(pluginForms);

    if (fontsApiKey) {
      plugins.push(grapesjsFonts);
      pluginsOpts[grapesjsFonts as unknown as string] = {
        key: fontsApiKey,
        limit: 40,
      };
    }
  }

  return { plugins, pluginsOpts };
}

export function GrapesEditor({
  mode,
  initialDesign,
  onChange,
  onEditor,
  fontsApiKey,
}: GrapesEditorProps) {
  const initializedRef = useRef(false);

  const defaultContent =
    mode === "email" ? emailDefaultContent : pageDefaultContent;
  const { plugins, pluginsOpts } = getPluginsConfig(mode, fontsApiKey);

  function handleEditor(editor: Editor) {
    if (!initializedRef.current) {
      if (initialDesign) {
        editor.loadProjectData(
          initialDesign as Parameters<Editor["loadProjectData"]>[0],
        );
      } else {
        editor.setComponents(defaultContent);
      }

      initializedRef.current = true;
    }

    onEditor?.(editor);

    const sync = () => {
      onChange({
        html: buildHtml(editor),
        design: editor.getProjectData(),
      });
    };

    editor.on("update", sync);
    editor.on("destroy", () => {
      editor.off("update", sync);
    });
    sync();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1C2945] bg-white shadow-[0_24px_60px_rgba(2,11,29,0.35)]">
      <GjsEditor
        grapesjs={grapesjs}
        grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
        onEditor={handleEditor}
        options={{
          height: "720px",
          storageManager: false,
          noticeOnUnload: false,
          plugins,
          pluginsOpts,
        }}
      />
    </div>
  );
}
