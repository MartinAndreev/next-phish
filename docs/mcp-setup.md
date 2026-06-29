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
5. You should see a hammer icon (🔧) indicating tools are available

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

## What Can You Do?

Once connected, you can use natural language to manage your phishing simulations. Here are some examples:

### Organizations

- "List all my organizations"
- "Create a new organization called 'Security Team'"

### Email Templates

- "Show me all email templates"
- "Create an email template called 'Fake Invoice' with a professional look"
- "Update the 'Password Reset' template to use a new design"

### Pages

- "List all pages in my organization"
- "Create a landing page that looks like a Google login"
- "Import the page from https://example.com/login"
- "Delete the page called 'Old Template'"

### Files

- "List all uploaded files"
- "Show me files attached to email templates"

### Jobs

- "Check the status of my import job"

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
