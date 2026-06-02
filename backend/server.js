const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { config } = require("./config");
const { closeDb, connectDb } = require("./db");
const { HttpError } = require("./errors");
const {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
} = require("./applications");

const frontendRoot = path.join(__dirname, "..", "frontend");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  try {
    applySecurityHeaders(res);
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (!["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"].includes(req.method)) {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(url, res);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = status >= 500 && config.nodeEnv === "production"
      ? "Internal server error"
      : error.message || "Internal server error";
    if (status >= 500) {
      console.error(error);
    }
    sendJson(res, status, { error: message });
  }
});

async function handleApi(req, res, url) {
  if (url.pathname === "/api/applications" && req.method === "GET") {
    sendJson(res, 200, await listApplications());
    return;
  }

  if (url.pathname === "/api/applications" && req.method === "POST") {
    sendJson(res, 201, await createApplication(await readJson(req)));
    return;
  }

  const match = url.pathname.match(/^\/api\/applications\/([^/]+)$/);
  if (match && req.method === "PUT") {
    const app = await updateApplication(decodeURIComponent(match[1]), await readJson(req));
    sendJson(res, app ? 200 : 404, app || { error: "Application not found" });
    return;
  }

  if (match && req.method === "DELETE") {
    const deleted = await deleteApplication(decodeURIComponent(match[1]));
    sendJson(res, deleted ? 200 : 404, deleted ? { ok: true } : { error: "Application not found" });
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
}

function serveStatic(url, res) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(pathname).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(frontendRoot, safePath);

  if (!filePath.startsWith(frontendRoot)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const headers = {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": path.extname(filePath) === ".html" ? "no-store" : "public, max-age=3600",
    };
    res.writeHead(200, headers);
    res.end(data);
  });
}

function readJson(req) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    throw new HttpError(415, "Expected application/json.");
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function applySecurityHeaders(res) {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (config.nodeEnv === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

async function start() {
  await connectDb();
  server.listen(config.port, config.host, () => {
    console.log(`CPE Career Tracker running at http://${config.host}:${config.port}`);
  });
}

async function shutdown() {
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
