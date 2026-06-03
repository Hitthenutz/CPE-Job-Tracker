const fs = require("node:fs/promises");
const path = require("node:path");
const {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
} = require("../../backend/applications");
const { config } = require("../../backend/config");
const { HttpError } = require("../../backend/errors");

const frontendRoot = path.join(__dirname, "..", "..", "frontend");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

exports.handler = async function handler(event) {
  try {
    const method = event.httpMethod || "GET";
    const url = new URL(event.rawUrl || event.path || "/", "https://devpipeline.local");

    if (!["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"].includes(method)) {
      return json(405, { error: "Method not allowed" });
    }

    if (method === "OPTIONS") {
      return response(204, "", {});
    }

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return json(200, { ok: true });
    }

    if (!isAuthorized(event)) {
      return json(401, { error: "Authentication required" }, {
        "WWW-Authenticate": 'Basic realm="DevPipeline", charset="UTF-8"',
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return handleApi(event, method, url);
    }

    return serveStatic(url);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = status >= 500 && config.nodeEnv === "production"
      ? "Internal server error"
      : error.message || "Internal server error";
    if (status >= 500) console.error(error);
    return json(status, { error: message });
  }
};

async function handleApi(event, method, url) {
  if (url.pathname === "/api/applications" && method === "GET") {
    return json(200, await listApplications());
  }

  if (url.pathname === "/api/applications" && method === "POST") {
    return json(201, await createApplication(readJson(event)));
  }

  const match = url.pathname.match(/^\/api\/applications\/([^/]+)$/);
  if (match && method === "PUT") {
    const app = await updateApplication(decodeURIComponent(match[1]), readJson(event));
    return json(app ? 200 : 404, app || { error: "Application not found" });
  }

  if (match && method === "DELETE") {
    const deleted = await deleteApplication(decodeURIComponent(match[1]));
    return json(deleted ? 200 : 404, deleted ? { ok: true } : { error: "Application not found" });
  }

  return json(404, { error: "Route not found" });
}

async function serveStatic(url) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(pathname).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(frontendRoot, safePath);

  if (!filePath.startsWith(frontendRoot)) {
    return response(403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
  }

  try {
    return await fileResponse(filePath);
  } catch {
    return fileResponse(path.join(frontendRoot, "index.html"));
  }
}

async function fileResponse(filePath) {
  const data = await fs.readFile(filePath);
  const extension = path.extname(filePath);
  return response(200, data.toString("utf8"), {
    "Content-Type": types[extension] || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=3600",
  });
}

function readJson(event) {
  const contentType = header(event, "content-type");
  if (!contentType.includes("application/json")) {
    throw new HttpError(415, "Expected application/json.");
  }

  if (!event.body) return {};
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON");
  }
}

function json(status, payload, extraHeaders = {}) {
  return response(status, JSON.stringify(payload), {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
}

function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      ...securityHeaders(),
      ...headers,
    },
    body,
  };
}

function securityHeaders() {
  return {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

function isAuthorized(event) {
  if (!config.appPassword) return true;

  const authHeader = header(event, "authorization");
  if (!authHeader.startsWith("Basic ")) return false;

  let decoded = "";
  try {
    decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(":");
  const password = separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);
  return password === config.appPassword;
}

function header(event, name) {
  const headers = event.headers || {};
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? String(headers[key]) : "";
}
