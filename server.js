const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const { loadEnvFile } = require("./lib/env");

loadEnvFile();

const { companies, allowedIntervals } = require("./lib/company-config");
const { buildMockReport } = require("./lib/mock-data");
const { runWebhookWorkflow, workflowMode } = require("./lib/workflow-client");

const PORT = Number(process.env.PORT || 3000);
const HOST =
  process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body exceeded 1 MB."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function sanitizePathname(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  if (normalized === "/" || normalized === ".") {
    return path.join(PUBLIC_DIR, "index.html");
  }
  return path.join(PUBLIC_DIR, normalized);
}

function serveStatic(req, res, pathname) {
  const filePath = sanitizePathname(pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (error) {
    sendText(res, 404, "Not Found");
    return;
  }

  const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;

  try {
    const ext = path.extname(finalPath).toLowerCase();
    const content = fs.readFileSync(finalPath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Content-Length": content.length
    });
    res.end(content);
  } catch (error) {
    sendText(res, 500, "Unable to read static asset.");
  }
}

async function buildWorkflowResult(companyKey, intervalDays) {
  const company = companies[companyKey];

  if (!company) {
    const error = new Error("Unknown company.");
    error.statusCode = 400;
    throw error;
  }

  if (!allowedIntervals.includes(intervalDays)) {
    const error = new Error("Unsupported time interval.");
    error.statusCode = 400;
    throw error;
  }

  if (workflowMode === "mock") {
    return buildMockReport(company, intervalDays);
  }

  return runWebhookWorkflow({
    company,
    intervalDays
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");
  const pathname = requestUrl.pathname;

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      workflowMode,
      n8nConfigured: Boolean(process.env.N8N_WEBHOOK_URL),
      companies: Object.values(companies).map((company) => ({
        id: company.id,
        name: company.name
      })),
      allowedIntervals
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/run-report") {
    try {
      const body = await parseJsonBody(req);
      const companyKey = String(body.companyKey || "").trim().toLowerCase();
      const intervalDays = Number(body.intervalDays);
      const result = await buildWorkflowResult(companyKey, intervalDays);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, error.statusCode || 500, {
        ok: false,
        error: error.message || "Unexpected server error."
      });
    }
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res, pathname);
    return;
  }

  sendText(res, 405, "Method Not Allowed");
});

server.listen(PORT, HOST, () => {
  console.log("CSIS dashboard listening on http://" + HOST + ":" + PORT);
  console.log("Workflow mode:", workflowMode);
});
