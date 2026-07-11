# MCP tool catalogue contract

This is the exhaustive current registration inventory: **23 tools**. `R` and `O`
mean required and optional at the MCP schema boundary. All organization-scoped
entries include `organizationId: string` (`R`) unless noted.

## Common inputs

| Tool(s)                                                                                                                   | Input                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `list_email_templates`, `list_pages`, `list_sending_profiles`                                                             | `organizationId` R; `search?: string`, `limit?: number` 1–100, `offset?: number` >=0.                   |
| `get_email_template`, `delete_email_template`, `get_page`, `delete_page`, `get_sending_profile`, `delete_sending_profile` | `id: string` R; `organizationId: string` R.                                                             |
| `list_files`                                                                                                              | `organizationId` R; `purpose?: "EMAIL_ATTACHMENT" \| "IMPORT" \| "EXPORT"`; `emailTemplateId?: string`. |

## Organizations (4)

| Tool                  | Purpose                                        | Input                                                                                                             |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `list_organizations`  | List organizations available to the key owner. | Advertised: `organizationId` R, `search?`, `limit?` 1–100, `offset?` >=0. Handler ignores all and uses limit 50.  |
| `get_organization`    | Get one organization.                          | `organizationId: string` R; `id: string` R is also required by the advertised schema but ignored by this handler. |
| `create_organization` | Create organization.                           | `name: string` R, min 1; `slug: string` R, min 1, lowercase letters/numbers/hyphen format.                        |
| `delete_organization` | Delete organization.                           | `organizationId: string` R.                                                                                       |

## Email templates (5)

| Tool                    | Purpose                    | Input beyond common fields                                                                                                                                                                                               |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_email_templates`  | List templates.            | Common list shape.                                                                                                                                                                                                       |
| `get_email_template`    | Get template.              | Common ID-with-org shape.                                                                                                                                                                                                |
| `create_email_template` | Create template from HTML. | `name` R trimmed non-empty; `html` R non-empty; `tags?: string[]` (each trimmed non-empty); `status?: "DRAFT" \| "ACTIVE"` default `DRAFT`; `trackingPixel?: boolean` default `true`; `fileIds?: string[]` default `[]`. |
| `update_email_template` | Update template.           | `id`, `organizationId` R; optional `name`, `html`, `tags`, `status`, `trackingPixel`, `fileIds` with same types/enums; omitted name/html become empty strings and design becomes `{}` in handler.                        |
| `delete_email_template` | Delete template.           | Common ID-with-org shape.                                                                                                                                                                                                |

## Pages (6)

| Tool                   | Purpose           | Input beyond common fields                                                                                                                                                                                                     |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_pages`           | List pages.       | Common list shape.                                                                                                                                                                                                             |
| `get_page`             | Get page.         | Common ID-with-org shape.                                                                                                                                                                                                      |
| `create_page`          | Create page.      | `name` R trimmed non-empty; `type?: "LANDING" \| "REDIRECT"` default `LANDING`; `html?: string` default `""`; `status?: "DRAFT" \| "ACTIVE"` default `DRAFT`; `captureData?: boolean` default `false`; `redirectUrl?: string`. |
| `update_page`          | Update page.      | `id`, `organizationId` R; optional `name`, `type`, `html`, `status`, `captureData`, `redirectUrl` with create types; omitted name becomes empty string in handler.                                                             |
| `delete_page`          | Delete page.      | Common ID-with-org shape.                                                                                                                                                                                                      |
| `import_page_from_url` | Start URL import. | `organizationId` R; `url` R valid URL; `includeAssets?: boolean`.                                                                                                                                                              |

## Files and jobs (2)

| Tool             | Purpose                    | Input                                   |
| ---------------- | -------------------------- | --------------------------------------- |
| `list_files`     | List uploaded files.       | Common file-list shape.                 |
| `get_job_status` | Get background-job status. | `jobId: string` R; no `organizationId`. |

## Sending profiles (5)

| Tool                     | Purpose                   | Input beyond common fields                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_sending_profiles`  | List mail configurations. | Common list shape.                                                                                                                                                                                                                                                                                                                                                                                             |
| `get_sending_profile`    | Get profile.              | Common ID-with-org shape.                                                                                                                                                                                                                                                                                                                                                                                      |
| `create_sending_profile` | Create profile.           | `organizationId`, `name`, `providerType`, `fromName`, `fromEmail`, `providerConfig` R. `name`/`fromName` trimmed non-empty; `fromEmail` valid email; `providerType` is `SMTP`, `MICROSOFT_GRAPH`, `AWS_SES`, `SENDGRID`, `MAILGUN`, `POSTMARK`, `RESEND`, or `GENERAL_API`; `providerConfig: Record<string, unknown>`; `replyToEmail?:` valid email; `headers?: Record<string,string>`; `isDefault?: boolean`. |
| `update_sending_profile` | Update profile.           | `id`, `organizationId` R; optional trimmed non-empty `name`, `fromName`; optional valid `fromEmail`; `replyToEmail?: string \| null` (email when string); `headers?: Record<string,string> \| null`; `providerConfig?: Record<string,unknown>`; `isDefault?: boolean`. Provider type cannot be changed.                                                                                                        |
| `delete_sending_profile` | Delete profile.           | Common ID-with-org shape.                                                                                                                                                                                                                                                                                                                                                                                      |

## Target groups (1)

| Tool                  | Purpose                                   | Input                                                                                                                                          |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_target_group` | Create group with optional initial users. | `organizationId`, `name` R; name trimmed non-empty. `status?: "DRAFT" \| "ACTIVE" \| "ARCHIVED"` default `DRAFT`; `users?: TargetGroupUser[]`. |

## Explicit exclusions

The current MCP registration does **not** expose file upload/delete, sending-profile
test/connection/capability tools, target-group list/get/update/delete/user/import
tools, page import-status/list-imports/submission tools, organization member listing,
or email-template/page operations beyond the entries above.
