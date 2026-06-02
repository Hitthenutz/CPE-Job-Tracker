const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { config } = require("./config");
const { closeDb, connectDb } = require("./db");
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
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(url, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Internal server error" });
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

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

function readJson(req) {
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

async function start() {
  await connectDb();
  server.listen(config.port, "127.0.0.1", () => {
    console.log(`CPE Career Tracker running at http://127.0.0.1:${config.port}`);
  });
}

process.on("SIGINT", async () => {
  await closeDb();
  process.exit(0);
});

start().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
