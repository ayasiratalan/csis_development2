window.CSIS_DASHBOARD_CONFIG = {
  // Optional direct browser-to-n8n mode.
  // Leave blank for file-preview mode. For real n8n execution, paste the
  // production webhook URL from an n8n Webhook trigger, for example:
  // n8nWebhookUrl: "https://your-n8n-domain.com/webhook/csis-company-memo"
  n8nWebhookUrl: "https://futureslab.app.n8n.cloud/webhook/csis-company-memo",

  // Do not put private API keys here on a public site. Use the Node backend
  // with N8N_AUTH_HEADER/N8N_AUTH_VALUE for authenticated production setups.
  n8nAuthHeader: "",
  n8nAuthValue: ""
};
