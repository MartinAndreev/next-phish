## Inherited decisions

- Feature 003 requires private, immutable copies of campaign resources and deduplicated recipients.
- Existing specification materializes those copies when the scheduled campaign is created, before `pending_start`; scheduled campaigns may rebuild copies when rescheduled.
- The proposed change replaces aggregate JSON snapshots with hidden relational resource copies.
- Email/page catalog previews should be generated in the user’s browser and cached in backend storage, avoiding headless-browser workers.
- Existing `Json` columns such as `EmailTemplate.design` and encrypted `MailSendingProfile.providerConfig` remain; only the aggregate `CampaignSnapshot` JSON design is removed.

## Diagnosis

### 1. Relational shadow copies are a sound design

They preserve normal relational querying and let existing rendering/sending code operate on ordinary resource records. Add shared metadata to `EmailTemplate`, `Page`, `MailSendingProfile`, and `TargetGroup`:

```prisma
enum ResourceVisibility {
  CATALOG
  SHADOW
}

visibility       ResourceVisibility @default(CATALOG)
shadowCampaignId String?
sourceResourceId String?
```

Recommended constraints:

- Shadow rows have an owning campaign.
- Catalog rows have no shadow owner.
- Source provenance uses `onDelete: SetNull`; deleting the original must not delete its shadow.
- Deleting a campaign may cascade to its shadow resources according to retention policy.
- Index catalog queries by `[organizationId, visibility, status]`.
- Shadow rows must be inaccessible through normal list, detail, update, delete, picker, and MCP paths.
- `MailSendingProfile.isDefault` must be `false` for a shadow.
- Copy encrypted provider configuration without decrypting it.
- Deduplicate target users during cloning using `lower(trim(email))`.

For pages, account for transitive dependencies: `redirectPageId` currently references another page. Either clone the referenced redirect page too and redirect the shadow to that copy, or flatten the resolved redirect behavior into the shadow. Leaving it pointing at a mutable catalog page violates immutability.

### 2. Attachments need a separate decision

Copying `EmailTemplate` and `EmailTemplateFile` rows is not enough. `packages/database/prisma/schema.prisma:214-247` makes `File` the owner of an R2 key, while deleting the file cascades through attachment joins. A source attachment deletion would therefore break a campaign shadow.

Recommended storage model:

```text
StoredObject/Blob (immutable R2 key, hash, size, MIME)
       ↑
File (catalog or shadow metadata/reference)
       ↑
EmailTemplateFile
```

Shadow templates get new `File` rows referencing the same immutable blob. Blob deletion occurs only after no catalog or shadow references remain. This avoids duplicating bytes per campaign while preserving history.

### 3. Materialize before `pending_start`, not at `active`

Interpret “when starting a campaign” as occurrence materialization, not the actual send transition.

Recommended transaction:

1. Validate organization and all source dependencies.
2. Create the concrete occurrence campaign.
3. Clone the selected email template, page graph, sending profile, target group, and deduplicated users.
4. Attach the shadow rows to that occurrence.
5. Commit the campaign as `scheduled`.
6. Lock/reject rebuilding after it reaches `pending_start`.

Creating copies only when entering `active` conflicts with the existing 003 contract: sources could change or disappear while the campaign is scheduled or pending.

### 4. Browser-generated previews are possible, with limitations

The approach is good as a **best-effort derived cache**:

- No headless browser or worker rendering is required.
- Catalog reads become inexpensive image loads.
- Rendering work is distributed across editor browsers.

However, browsers do not expose a normal API to take an automatic screenshot of arbitrary DOM. Libraries such as `html2canvas` or `html-to-image` reconstruct the DOM into a canvas. They are not pixel-perfect browser or email-client screenshots and may fail on cross-origin images, fonts, unsupported CSS, or very tall pages.

Recommended flow:

1. Save the canonical template/page.
2. Server increments a `revision` and marks preview `PENDING`.
3. Client fetches/renders the persisted revision—not unsaved local HTML.
4. Substitute fixed dummy values such as `Alex Example`, `alex@example.invalid`, and a nonfunctional URL.
5. Render sanitized HTML in an isolated preview iframe with a restrictive CSP.
6. Wait for permitted images/fonts with a fixed timeout.
7. Capture at a fixed viewport and renderer version.
8. Upload a bounded PNG/WebP through a dedicated preview endpoint or presigned R2 upload.
9. Finalize with `{resourceId, revision, objectKey}`.
10. Backend validates that the resource revision still matches before attaching the image.
11. Failed/missing previews show a placeholder and support “Regenerate preview.”

Suggested source fields:

```prisma
enum PreviewStatus {
  MISSING
  PENDING
  READY
  FAILED
  STALE
}

revision               Int           @default(1)
previewStatus          PreviewStatus @default(MISSING)
previewFileId          String?       @unique
previewRevision        Int?
previewRendererVersion Int?
previewUpdatedAt       DateTime?
```

Also add `CATALOG_PREVIEW` to `FilePurpose`.

For catalog cards, prefer a bounded viewport thumbnail rather than a truly unbounded full-page image. Full-page canvases can exhaust memory on mobile browsers.

## Drift / contradiction check

- **High:** Materializing on transition to `active` would revise the existing decision that immutable copies exist when an occurrence campaign is created and are rebuilt while still `scheduled`.
- **High:** Merely duplicating resource rows does not satisfy “complete copy” if attachments or redirected pages still point to mutable/deletable sources.
- **Medium:** Client previews cannot be guaranteed. If every resource must always have a preview, a trusted renderer remains necessary somewhere. Without one, missing previews must be accepted.
- **Medium:** A client-generated image is untrusted presentation data. It must never become authoritative evidence of what will be sent.

## Concrete review findings

- **Blocker — shadow data exposure:**  
  `packages/backend/src/email-template/repositories/email-template.repository.ts:70-110` and `packages/backend/src/page/repositories/page.repository.ts:32-73` query only by organization/ID. Without mandatory visibility filters, shadow rows will appear in catalogs and can be retrieved normally.

- **Blocker — shadow mutation:**  
  `packages/backend/src/email-template/repositories/email-template.repository.ts:141-153` and `packages/backend/src/page/repositories/page.repository.ts:97-113` update by organization and ID without distinguishing private shadow rows. Shadow access needs internal-only repository methods.

- **High — incomplete attachment immutability:**  
  `packages/database/prisma/schema.prisma:214-247` associates template files with mutable `File` rows and cascade deletion. Cloning only `EmailTemplateFile` references does not preserve campaign attachments.

- **High — recipient deduplication insufficient:**  
  `packages/database/prisma/schema.prisma:405-419` uniquely constrains the original email text. Case and whitespace variants remain distinct. Shadow-group creation must populate a normalized email and enforce uniqueness on it.

- **High — current upload path is unsuitable for previews:**  
  `packages/shared/src/schemas/file.schema.ts:18-23` has no maximum size, dimension, or MIME allowlist. `packages/backend/src/file/commands/upload-file.command.ts:17-28` decodes arbitrary base64 and trusts client-provided size and type. Preview uploads need bounded, image-specific validation.

- **High — preview confidentiality:**  
  `packages/backend/src/storage/r2-client.ts:31-50` constructs public R2 URLs. Campaign/page thumbnails may reveal organization branding or phishing content. Prefer a private bucket with signed URLs or an authenticated image proxy.

- **High — file deletion organization scope:**  
  `apps/next-app/src/server/modules/file/file.router.ts:49-53` dispatches deletion using only a file ID. A preview endpoint should not reuse this deletion behavior until organization ownership is enforced.

- **High — sending-profile secret retention:**  
  `packages/backend/src/mail-sending/services/mail-sending-profile.service.ts:19-32` encrypts sensitive provider fields. Shadow cloning should copy encrypted configuration directly, never expose it to campaign DTOs, and define retention behavior for credentials that have since been revoked.

- **Medium — rendering variability:**  
  `apps/next-app/src/components/organisms/grapes-editor/grapes-editor.tsx:24-27` builds browser-rendered HTML, while line 145 loads editor CSS externally. Deterministic previews need pinned local assets, fixed viewport/DPR/fonts, and a renderer version.

## Recommendation

Adopt both changes with these boundaries:

1. Use relational shadow copies owned by the occurrence campaign.
2. Materialize them transactionally before `pending_start`.
3. Introduce immutable stored blobs for attachments instead of either sharing deletable `File` ownership or copying every object.
4. Make `visibility = CATALOG` the mandatory default filter in all existing repositories and pickers.
5. Generate previews after successful template/page saves as a best-effort client task.
6. Use a sandboxed, sanitized, network-restricted renderer.
7. Use revision-based compare-and-swap so an older browser upload cannot overwrite a newer preview.
8. Validate and preferably decode/re-encode preview images server-side; reject SVG and arbitrary MIME types.
9. Serve previews privately and keep placeholder/stale states as normal behavior.

## Risks

- Canvas capture may fail because of CORS, unsupported CSS, browser memory, or the user closing the tab.
- Browser-generated previews will vary somewhat across platforms.
- Malicious clients can upload misleading images unless upload/finalization is tightly bound to organization, resource, and revision.
- Provider credentials copied into campaign shadows increase secret retention.
- Page redirects, imported assets, and email attachments can silently remain mutable unless the clone graph is fully defined.
- Application-only immutability can regress; database checks or tightly isolated repositories are preferable.

## Need from main agent

Before implementation, confirm these three architectural interpretations:

- “Start” means occurrence materialization before `pending_start`, not transition to `active`.
- Catalog previews are best-effort; missing previews may show a placeholder.
- Attachments use immutable shared blobs with shadow `File` references rather than physically duplicating R2 objects per campaign.

## Suggested execution prompt

No implementation handoff is warranted until those three decisions are confirmed.
