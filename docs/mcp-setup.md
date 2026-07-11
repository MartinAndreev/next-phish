# Setting Up the MCP Server

This guide walks you through connecting AI assistants like Claude, ChatGPT, or other MCP-compatible tools to your NextPhish instance. Once connected, you can use natural language to manage your phishing simulations — create pages, templates, organizations, and more, all through conversation.

## What is MCP?

MCP stands for **Model Context Protocol**. It's a standard way for AI assistants to connect to external tools and data sources. Think of it like giving your AI assistant a direct line to your NextPhish account — instead of copying and pasting between windows, you can just ask it to do things for you.

For example, once connected, you could say:

> "Create a landing page called 'Office 365 Login' that looks like a Microsoft sign-in page"

And the AI will create it in your NextPhish account.

## Before You Start

You'll need:

- A running NextPhish instance with the MCP feature enabled
- An admin account on that instance
- An MCP-compatible AI client (Claude Desktop, Cursor, or any tool that supports MCP)

## Step 1: Create an API Key

API keys are like special passwords that let external tools access your NextPhish account securely. You'll create one specifically for your AI assistant.

1. Log in to your NextPhish dashboard
2. Click **Settings** in the sidebar (under Administration)
3. Click the **API Keys** tab
4. Click **Create API key**
5. Fill in the details:
   - **Name**: Give it a descriptive name like "Claude Desktop" or "My AI Assistant"
   - **Type**: Choose **Personal** — this key is tied to your account
   - **Permissions**: Check the boxes for what you want the AI to be able to do. If you're not sure, select all **read** and **write** permissions
   - **Expiration**: Choose how long the key should last. 90 days is a good default
6. Click **Create**
7. **Copy the key immediately!** You'll only see it once. It will look something like `put_abc123xyz...`. Save it somewhere safe like a password manager

:::warning
Store your API key securely. Anyone with this key can access your NextPhish account. If you lose it or think it's been compromised, revoke it from the API Keys tab and create a new one.
:::

## Step 2: Find Your MCP Server URL

Your MCP server URL is your NextPhish app URL followed by `/api/mcp`. For example:

- If your NextPhish is at `https://phishing.example.com`, your MCP URL is:
  `https://phishing.example.com/api/mcp`

- If you're running locally, it's probably:
  `http://localhost/api/mcp`

You'll need this URL in the next step.

## Step 3: Connect Your AI Client

The setup process varies depending on which AI client you're using. Pick the one that applies to you.

### Claude Desktop

1. Open Claude Desktop
2. Go to **Settings** → **Developer** → **Edit Config**
3. Add the following to your configuration file:

```json
{
  "mcpServers": {
    "nextphish": {
      "url": "https://your-nextphish-url/api/mcp",
      "headers": {
        "x-api-key": "put_your_api_key_here"
      }
    }
  }
}
```

Replace `https://your-nextphish-url/api/mcp` with your actual MCP server URL, and `put_your_api_key_here` with the API key you created in Step 1.

4. Save the file and restart Claude Desktop
5. You should see a hammer icon indicating tools are available

### Cursor

1. Open Cursor
2. Go to **Settings** → **MCP**
3. Click **Add new MCP server**
4. Enter:
   - **Name**: NextPhish
   - **Type**: HTTP
   - **URL**: `https://your-nextphish-url/api/mcp`
5. Add a header:
   - **Key**: `x-api-key`
   - **Value**: `put_your_api_key_here`
6. Save and restart Cursor

### Other MCP Clients

Most MCP clients accept a server URL and headers. Use:

- **Server URL**: `https://your-nextphish-url/api/mcp`
- **Header**: `x-api-key` → `put_your_api_key_here`

Check your client's documentation for specific setup instructions.

## Step 4: Test the Connection

Once connected, try asking your AI assistant something simple:

> "List my organizations"

If everything is set up correctly, the AI will respond with your organizations. If not, double-check:

- Your API key is correct and hasn't expired
- Your MCP server URL is correct
- Your NextPhish instance is running and accessible

## Calling Conventions

### Authentication

All requests require the `x-api-key` header with a valid API key. Missing or invalid keys receive a 401 response.

### Discovery

The MCP `tools/list` response from your connected deployment is the runtime authority for available tools. This documentation covers the tools registered in the repository version; always trust the live `tools/list` over this guide for your deployment.

### Input format

Every tool accepts a JSON object as input. String IDs are opaque — do not assume UUID or any other format.

### Organization scoping

Most tools require an `organizationId` field to scope the operation to a specific organization. The two exceptions are `create_organization` (which creates a new organization) and `get_job_status` (which uses a job ID instead). The `list_organizations` tool advertises `organizationId` in its schema, but the handler ignores it and always lists with a fixed limit of 50.

### Authorization

Permissions are enforced by the existing backend procedures. The API key's permissions determine what operations are allowed. A key with broad access does not bypass organization membership restrictions.

### Response format

Successful responses return a single text content item containing a JSON-stringified result.

## Tool Reference

This is the complete list of 23 MCP tools registered by the NextPhish server. Tools are grouped by domain.

### Organizations (4 tools)

| Tool                  | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `list_organizations`  | List organizations available to the key owner. |
| `get_organization`    | Get one organization by ID.                    |
| `create_organization` | Create a new organization.                     |
| `delete_organization` | Delete an organization.                        |

#### Input: `list_organizations`

| Field            | Type   | Required | Notes                                                                          |
| ---------------- | ------ | -------- | ------------------------------------------------------------------------------ |
| `organizationId` | string | Yes      | Schema-accepted but **handler ignores all input**; always lists with limit 50. |
| `search`         | string | No       | Ignored by handler.                                                            |
| `limit`          | number | No       | Ignored by handler. Schema allows 1–100.                                       |
| `offset`         | number | No       | Ignored by handler. Schema allows >= 0.                                        |

#### Input: `get_organization`

| Field            | Type   | Required | Notes                                                                           |
| ---------------- | ------ | -------- | ------------------------------------------------------------------------------- |
| `organizationId` | string | Yes      | Used to scope the request.                                                      |
| `id`             | string | Yes      | Schema-accepted but **handler ignores this field**; uses `organizationId` only. |

#### Input: `create_organization`

| Field  | Type   | Required | Notes                                                                      |
| ------ | ------ | -------- | -------------------------------------------------------------------------- |
| `name` | string | Yes      | Minimum 1 character.                                                       |
| `slug` | string | Yes      | Minimum 1 character. Must be lowercase letters, numbers, and hyphens only. |

#### Input: `delete_organization`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `organizationId` | string | Yes      |       |

### Email Templates (5 tools)

| Tool                    | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `list_email_templates`  | List email templates in an organization. |
| `get_email_template`    | Get an email template by ID.             |
| `create_email_template` | Create a new email template from HTML.   |
| `update_email_template` | Update an existing email template.       |
| `delete_email_template` | Delete an email template.                |

#### Input: `list_email_templates`

| Field            | Type   | Required | Notes  |
| ---------------- | ------ | -------- | ------ |
| `organizationId` | string | Yes      |        |
| `search`         | string | No       |        |
| `limit`          | number | No       | 1–100. |
| `offset`         | number | No       | >= 0.  |

#### Input: `get_email_template`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `id`             | string | Yes      |       |
| `organizationId` | string | Yes      |       |

#### Input: `create_email_template`

| Field            | Type     | Required | Notes                                        |
| ---------------- | -------- | -------- | -------------------------------------------- |
| `organizationId` | string   | Yes      |                                              |
| `name`           | string   | Yes      | Trimmed, must be non-empty.                  |
| `html`           | string   | Yes      | Must be non-empty.                           |
| `tags`           | string[] | No       | Each tag must be non-empty when trimmed.     |
| `status`         | string   | No       | `"DRAFT"` or `"ACTIVE"`. Default: `"DRAFT"`. |
| `trackingPixel`  | boolean  | No       | Default: `true`.                             |
| `fileIds`        | string[] | No       | Default: `[]`.                               |

#### Input: `update_email_template`

| Field            | Type     | Required | Notes                                                                           |
| ---------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `id`             | string   | Yes      |                                                                                 |
| `organizationId` | string   | Yes      |                                                                                 |
| `name`           | string   | No       | **Caveat:** if omitted, the handler passes an empty string `""` to the backend. |
| `html`           | string   | No       | **Caveat:** if omitted, the handler passes an empty string `""` to the backend. |
| `tags`           | string[] | No       |                                                                                 |
| `status`         | string   | No       | `"DRAFT"` or `"ACTIVE"`.                                                        |
| `trackingPixel`  | boolean  | No       |                                                                                 |
| `fileIds`        | string[] | No       |                                                                                 |

> **Important:** When `name` or `html` are omitted, the handler substitutes empty strings and sets `design` to `{}`. This is not a safe partial-update — omitted fields are explicitly overwritten with empty values.

#### Input: `delete_email_template`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `id`             | string | Yes      |       |
| `organizationId` | string | Yes      |       |

### Pages (6 tools)

| Tool                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `list_pages`           | List pages in an organization. |
| `get_page`             | Get a page by ID.              |
| `create_page`          | Create a new page.             |
| `update_page`          | Update an existing page.       |
| `delete_page`          | Delete a page.                 |
| `import_page_from_url` | Start a URL import job.        |

#### Input: `list_pages`

| Field            | Type   | Required | Notes  |
| ---------------- | ------ | -------- | ------ |
| `organizationId` | string | Yes      |        |
| `search`         | string | No       |        |
| `limit`          | number | No       | 1–100. |
| `offset`         | number | No       | >= 0.  |

#### Input: `get_page`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `id`             | string | Yes      |       |
| `organizationId` | string | Yes      |       |

#### Input: `create_page`

| Field            | Type    | Required | Notes                                              |
| ---------------- | ------- | -------- | -------------------------------------------------- |
| `organizationId` | string  | Yes      |                                                    |
| `name`           | string  | Yes      | Trimmed, must be non-empty.                        |
| `type`           | string  | No       | `"LANDING"` or `"REDIRECT"`. Default: `"LANDING"`. |
| `html`           | string  | No       | Default: `""`.                                     |
| `status`         | string  | No       | `"DRAFT"` or `"ACTIVE"`. Default: `"DRAFT"`.       |
| `captureData`    | boolean | No       | Default: `false`.                                  |
| `redirectUrl`    | string  | No       | Optional URL for redirect pages.                   |

#### Input: `update_page`

| Field            | Type    | Required | Notes                                                                           |
| ---------------- | ------- | -------- | ------------------------------------------------------------------------------- |
| `id`             | string  | Yes      |                                                                                 |
| `organizationId` | string  | Yes      |                                                                                 |
| `name`           | string  | No       | **Caveat:** if omitted, the handler passes an empty string `""` to the backend. |
| `type`           | string  | No       | `"LANDING"` or `"REDIRECT"`.                                                    |
| `html`           | string  | No       |                                                                                 |
| `status`         | string  | No       | `"DRAFT"` or `"ACTIVE"`.                                                        |
| `captureData`    | boolean | No       |                                                                                 |
| `redirectUrl`    | string  | No       |                                                                                 |

> **Important:** When `name` is omitted, the handler substitutes an empty string. The `design` and `redirectPageId` fields are not exposed through MCP.

#### Input: `delete_page`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `id`             | string | Yes      |       |
| `organizationId` | string | Yes      |       |

#### Input: `import_page_from_url`

| Field            | Type    | Required | Notes                |
| ---------------- | ------- | -------- | -------------------- |
| `organizationId` | string  | Yes      |                      |
| `url`            | string  | Yes      | Must be a valid URL. |
| `includeAssets`  | boolean | No       |                      |

### Files and Jobs (2 tools)

| Tool             | Purpose                                 |
| ---------------- | --------------------------------------- |
| `list_files`     | List uploaded files in an organization. |
| `get_job_status` | Get the status of a background job.     |

#### Input: `list_files`

| Field             | Type   | Required | Notes                                            |
| ----------------- | ------ | -------- | ------------------------------------------------ |
| `organizationId`  | string | Yes      |                                                  |
| `purpose`         | string | No       | `"EMAIL_ATTACHMENT"`, `"IMPORT"`, or `"EXPORT"`. |
| `emailTemplateId` | string | No       | Filter files attached to a specific template.    |

#### Input: `get_job_status`

| Field   | Type   | Required | Notes                         |
| ------- | ------ | -------- | ----------------------------- |
| `jobId` | string | Yes      | No `organizationId` required. |

### Sending Profiles (5 tools)

| Tool                     | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `list_sending_profiles`  | List sending profiles (mail configurations) in an organization. |
| `get_sending_profile`    | Get a sending profile by ID.                                    |
| `create_sending_profile` | Create a new sending profile.                                   |
| `update_sending_profile` | Update an existing sending profile.                             |
| `delete_sending_profile` | Delete a sending profile.                                       |

#### Input: `list_sending_profiles`

| Field            | Type   | Required | Notes  |
| ---------------- | ------ | -------- | ------ |
| `organizationId` | string | Yes      |        |
| `search`         | string | No       |        |
| `limit`          | number | No       | 1–100. |
| `offset`         | number | No       | >= 0.  |

#### Input: `get_sending_profile`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `id`             | string | Yes      |       |
| `organizationId` | string | Yes      |       |

#### Input: `create_sending_profile`

| Field            | Type    | Required | Notes                                                                                                                     |
| ---------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `organizationId` | string  | Yes      |                                                                                                                           |
| `name`           | string  | Yes      | Trimmed, must be non-empty.                                                                                               |
| `providerType`   | string  | Yes      | One of: `"SMTP"`, `"MICROSOFT_GRAPH"`, `"AWS_SES"`, `"SENDGRID"`, `"MAILGUN"`, `"POSTMARK"`, `"RESEND"`, `"GENERAL_API"`. |
| `fromName`       | string  | Yes      | Trimmed, must be non-empty.                                                                                               |
| `fromEmail`      | string  | Yes      | Must be a valid email address.                                                                                            |
| `providerConfig` | object  | Yes      | `Record<string, unknown>` — provider-specific configuration.                                                              |
| `replyToEmail`   | string  | No       | Must be a valid email address when provided.                                                                              |
| `headers`        | object  | No       | `Record<string, string>` — custom email headers.                                                                          |
| `isDefault`      | boolean | No       |                                                                                                                           |

#### Input: `update_sending_profile`

| Field            | Type           | Required | Notes                                                  |
| ---------------- | -------------- | -------- | ------------------------------------------------------ |
| `id`             | string         | Yes      |                                                        |
| `organizationId` | string         | Yes      |                                                        |
| `name`           | string         | No       | Trimmed, must be non-empty when provided.              |
| `fromName`       | string         | No       | Trimmed, must be non-empty when provided.              |
| `fromEmail`      | string         | No       | Must be a valid email address when provided.           |
| `replyToEmail`   | string \| null | No       | Valid email when string; `null` to clear.              |
| `headers`        | object \| null | No       | `Record<string, string>` when object; `null` to clear. |
| `providerConfig` | object         | No       | `Record<string, unknown>`.                             |
| `isDefault`      | boolean        | No       |                                                        |

> **Note:** The `providerType` cannot be changed on an existing profile.

#### Input: `delete_sending_profile`

| Field            | Type   | Required | Notes |
| ---------------- | ------ | -------- | ----- |
| `id`             | string | Yes      |       |
| `organizationId` | string | Yes      |       |

### Target Groups (1 tool)

| Tool                  | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `create_target_group` | Create a new target group with optional initial users. |

#### Input: `create_target_group`

| Field            | Type   | Required | Notes                                                       |
| ---------------- | ------ | -------- | ----------------------------------------------------------- |
| `organizationId` | string | Yes      |                                                             |
| `name`           | string | Yes      | Trimmed, must be non-empty.                                 |
| `status`         | string | No       | `"DRAFT"`, `"ACTIVE"`, or `"ARCHIVED"`. Default: `"DRAFT"`. |
| `users`          | array  | No       | Array of target group user objects (see below).             |

**Target group user object:**

| Field       | Type   | Required | Notes                          |
| ----------- | ------ | -------- | ------------------------------ |
| `email`     | string | Yes      | Must be a valid email address. |
| `firstName` | string | Yes      | Trimmed, must be non-empty.    |
| `lastName`  | string | Yes      | Trimmed, must be non-empty.    |
| `position`  | string | No       | Trimmed when provided.         |

## What Is Not Available Through MCP

The MCP server does **not** expose the following operations. If you need these, use the NextPhish dashboard directly:

- **File upload and delete** — only file listing is available via MCP
- **Sending profile testing, connection verification, or capability detection**
- **Target group listing, getting, updating, deleting, user management, or user import**
- **Page import status checking, import listing, or submission management**
- **Organization member listing or management**
- **Any tRPC procedure that has no corresponding registered MCP tool**

The live `tools/list` from your deployment is the definitive source of truth for available tools.

## Troubleshooting

### "Unauthorized" or "Invalid API Key"

- Make sure you copied the full API key (it's long!)
- Check that the key hasn't expired in the API Keys tab
- Verify the `x-api-key` header is set correctly in your client

### "Connection refused" or "Server not found"

- Make sure your NextPhish instance is running
- Check that the MCP URL is correct (include `https://` or `http://`)
- If running locally, make sure your AI client can reach `localhost`

### Tools not showing up in my AI client

- Restart your AI client after adding the MCP configuration
- Check your client's logs for connection errors
- Make sure your NextPhish instance is publicly accessible (or that your client can reach it)

### "Organization not found" errors

Many operations require an active organization. Make sure:

- You belong to at least one organization
- The organization has been set as your active organization in the dashboard

## Revoking Access

If you need to revoke an AI client's access:

1. Go to **Settings** → **API Keys**
2. Find the key you want to revoke
3. Click the trash icon
4. Confirm the deletion

The AI client will immediately lose access to your NextPhish account.

## Security Best Practices

- **Use separate keys** for different tools or clients
- **Set expiration dates** so keys don't live forever
- **Only grant permissions you need** — if a tool only needs to read data, don't give it write access
- **Rotate keys regularly** — create a new key and delete the old one every few months
- **Monitor usage** — check the API Keys tab to see how many requests each key has made
