const fs = require("fs");
const path = require("path");

const inputPath = path.join(
  __dirname,
  "..",
  "Summary_Agent_v11_OnePager_CSIS_Outreach (1).json"
);
const outputPath = path.join(
  __dirname,
  "..",
  "Summary_Agent_v11_OnePager_CSIS_Outreach_WEBHOOK.json"
);

const workflow = JSON.parse(fs.readFileSync(inputPath, "utf8"));

workflow.name = "Summary_Agent_v11_OnePager_CSIS_Outreach_WEBHOOK";
workflow.active = false;

const removeNames = new Set([
  "When clicking ‘Execute workflow’",
  "Get pending requests",
  "Loop Over Requests"
]);

workflow.nodes = workflow.nodes.filter((node) => !removeNames.has(node.name));

workflow.nodes.unshift({
  parameters: {
    httpMethod: "POST",
    path: "csis-company-memo",
    responseMode: "responseNode",
    options: {
      responseHeaders: {
        entries: [
          {
            name: "Access-Control-Allow-Origin",
            value: "*"
          },
          {
            name: "Access-Control-Allow-Methods",
            value: "POST, OPTIONS"
          },
          {
            name: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-API-Key"
          }
        ]
      }
    }
  },
  type: "n8n-nodes-base.webhook",
  typeVersion: 2.1,
  position: [-720, 768],
  id: "webhook-csis-company-memo",
  name: "Dashboard Webhook"
});

workflow.nodes.push({
  parameters: {
    mode: "manual",
    duplicateItem: false,
    assign: "assignBelow",
    includeOtherFields: false,
    fields: {
      values: [
        {
          name: "ok",
          type: "booleanValue",
          booleanValue: true
        },
        {
          name: "run_id",
          stringValue: "={{ $('Normalize Inputs').item.json.run_id || '' }}"
        },
        {
          name: "generated_at",
          stringValue: "={{ $now }}"
        },
        {
          name: "company_name",
          stringValue: "={{ $('Normalize Inputs').item.json.company_name || '' }}"
        },
        {
          name: "time_period_days",
          stringValue: "={{ $('Normalize Inputs').item.json.time_period_days || '' }}"
        },
        {
          name: "time_period_label",
          stringValue: "={{ $('Normalize Inputs').item.json.time_period_label || '' }}"
        },
        {
          name: "final_one_pager",
          stringValue: "={{ $json.final_one_pager || '' }}"
        },
        {
          name: "recent_developments_paragraph",
          stringValue: "={{ $json.recent_developments_paragraph || '' }}"
        },
        {
          name: "past_csis_engagement_paragraph",
          stringValue: "={{ $json.past_csis_engagement_paragraph || '' }}"
        },
        {
          name: "csis_convergence_paragraph",
          stringValue: "={{ $json.csis_convergence_paragraph || '' }}"
        },
        {
          name: "email_pitch_ideas",
          stringValue: "={{ $json.email_pitch_ideas || '' }}"
        },
        {
          name: "excel_file_name",
          stringValue: "={{ ($('Normalize Inputs').item.json.company_name || 'Company') + '_validated_documents_' + $now.toFormat('yyyy-MM-dd') + '.xlsx' }}"
        },
        {
          name: "validated_sources",
          type: "arrayValue",
          arrayValue: "={{ $('Aggregate Documents for LLM').item.json.validated_sources || [] }}"
        }
      ]
    },
    options: {}
  },
  type: "n8n-nodes-base.set",
  typeVersion: 3.4,
  position: [3136, 960],
  id: "prepare-webhook-response",
  name: "Prepare Webhook Response"
});

workflow.nodes.push({
  parameters: {
    respondWith: "json",
    responseBody: "={{ $json }}",
    options: {
      responseCode: 200
    }
  },
  type: "n8n-nodes-base.respondToWebhook",
  typeVersion: 1.4,
  position: [3360, 960],
  id: "respond-dashboard",
  name: "Respond to Dashboard"
});

function updateNode(name, updater) {
  const node = workflow.nodes.find((candidate) => candidate.name === name);
  if (!node) throw new Error("Missing node: " + name);
  updater(node);
}

updateNode("Normalize Inputs", (node) => {
  node.position = [-480, 768];
  node.parameters.functionCode = node.parameters.functionCode.replace(
    "const item = items[0].json;",
    [
      "const incoming = items[0].json || {};",
      "const source = incoming.body && typeof incoming.body === 'object' ? incoming.body : incoming;",
      "const item = {",
      "  ...source,",
      "  requested_at: source.requested_at || incoming.headers?.['x-requested-at'] || new Date().toISOString(),",
      "  status: source.status || 'pending'",
      "};"
    ].join("\n")
  );
});

updateNode("Aggregate Documents for LLM", (node) => {
  node.parameters.functionCode = node.parameters.functionCode.replace(
    "const counts = {",
    [
      "const validatedSources = docs",
      "  .filter(d => d.source_class && d.source_class !== 'none')",
      "  .map((doc, idx) => ({",
      "    id: doc.run_id ? `${doc.run_id}_${idx + 1}` : `source_${idx + 1}`,",
      "    title: doc.title || '',",
      "    url: doc.url || '',",
      "    source_class: doc.source_class || '',",
      "    source_domain: doc.source_domain || '',",
      "    published_date: doc.published_date || '',",
      "    actual_doc_date: doc.actual_doc_date || doc.published_date || '',",
      "    validation_status: doc.validation_status || 'accepted',",
      "    entity_confidence: doc.entity_confidence || 0",
      "  }));",
      "const counts = {"
    ].join("\n")
  );
  node.parameters.functionCode = node.parameters.functionCode.replace(
    "doc_stats: counts,",
    "doc_stats: counts,\n    validated_sources: validatedSources,"
  );
});

updateNode("Append results to data_base_v1", (node) => {
  const value = node.parameters.columns.value;
  value.row_number = "={{ $('Normalize Inputs').item.json.row_number || '' }}";
  value.requested_at = "={{ $('Normalize Inputs').item.json.requested_at || '' }}";
  value.notes = "={{ $('Normalize Inputs').item.json.notes || '' }}";
});

const oldConnections = workflow.connections || {};
for (const name of removeNames) {
  delete oldConnections[name];
}
for (const [sourceName, sourceConnections] of Object.entries(oldConnections)) {
  const main = sourceConnections.main || [];
  for (const output of main) {
    for (let index = output.length - 1; index >= 0; index--) {
      if (removeNames.has(output[index].node)) {
        output.splice(index, 1);
      }
    }
  }
}

oldConnections["Dashboard Webhook"] = {
  main: [[{ node: "Normalize Inputs", type: "main", index: 0 }]]
};

oldConnections["Parse Final Strategist Output"] = {
  main: [
    [
      { node: "Append results to data_base_v1", type: "main", index: 0 },
      { node: "Prepare Webhook Response", type: "main", index: 0 }
    ]
  ]
};

oldConnections["Append results to data_base_v1"] = {
  main: [[]]
};

oldConnections["Prepare Webhook Response"] = {
  main: [[{ node: "Respond to Dashboard", type: "main", index: 0 }]]
};

workflow.connections = oldConnections;

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + "\n");
console.log("Wrote " + outputPath);
