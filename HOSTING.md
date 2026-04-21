# Hosting and Live n8n Connection

## What has to be true for the website button to run n8n

The dashboard button can run the real workflow only when these are all true:

- The website is opened through the Node server, not only as a local file.
- `WORKFLOW_MODE=webhook` is set on the website host.
- `N8N_WEBHOOK_URL` is set to the production n8n webhook URL.
- The n8n workflow is active and starts with a `POST` Webhook node.
- n8n returns JSON containing `final_one_pager` and `validated_sources`.

## n8n setup

Import this generated workflow into n8n:

```text
Summary_Agent_v11_OnePager_CSIS_Outreach_WEBHOOK.json
```

After import:

1. Open the `Dashboard Webhook` node.
2. Confirm method is `POST`.
3. Confirm path is `csis-company-memo`.
4. Confirm response mode uses `Respond to Dashboard`.
5. Reconnect credentials if n8n asks for Google Sheets, Google Drive, Tavily, or OpenAI credentials.
6. Activate the workflow.
7. Copy the production webhook URL.

The production URL usually looks like:

```text
https://your-n8n-domain.com/webhook/csis-company-memo
```

Do not use the `/webhook-test/` URL for the hosted website. The test URL only works while manually testing inside n8n.

## Recommended website hosting

Use a Node web host such as Render, Railway, Fly.io, or a VPS. This project includes:

- `Dockerfile`
- `render.yaml`
- `package.json` with `npm start`

## Render deployment

1. Push this folder to a GitHub repository.
2. In Render, create a new Web Service from that repository.
3. Use start command:

```bash
node server.js
```

4. Set environment variables:

```env
NODE_ENV=production
HOST=0.0.0.0
WORKFLOW_MODE=webhook
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/csis-company-memo
```

5. If you protect the n8n webhook with a header, also set:

```env
N8N_AUTH_HEADER=X-API-Key
N8N_AUTH_VALUE=your-secret-value
```

6. Deploy.
7. Open the Render URL and confirm the dashboard chip says:

```text
Workflow Mode: Live webhook
```

## Local live test before hosting

Create `.env` from the example:

```bash
cp .env.example .env
```

Edit `.env`:

```env
WORKFLOW_MODE=webhook
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/csis-company-memo
```

Run:

```bash
node server.js
```

Open:

```text
http://127.0.0.1:3000
```

Then click `Run Workflow`. If the workflow is active and credentials are valid, n8n should run and the dashboard should show the real memo plus validated sources.

## If it fails

- `Workflow Mode: Mock preview`: the server is not using `WORKFLOW_MODE=webhook`.
- `Webhook not configured`: `N8N_WEBHOOK_URL` is missing.
- `n8n webhook returned HTTP 404`: the workflow is not active, or the URL is wrong.
- `n8n webhook returned HTTP 500`: a node inside n8n failed. Open the n8n execution log.
- The dashboard shows a memo but no sources: the `validated_sources` field is missing from the n8n response.
