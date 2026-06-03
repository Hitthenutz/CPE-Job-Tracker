const fs = require("node:fs");
const path = require("node:path");

loadEnvFile();

const nodeEnv = process.env.NODE_ENV || "development";

const config = {
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  dbName: process.env.MONGODB_DB || "cpe_job_tracker",
  port: Number(process.env.PORT || 5173),
  host: process.env.HOST || (nodeEnv === "production" ? "0.0.0.0" : "127.0.0.1"),
  nodeEnv,
  appPassword: process.env.APP_PASSWORD || "",
  tlsAllowInvalidCertificates: process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === "true",
};

if (config.nodeEnv === "production" && config.tlsAllowInvalidCertificates) {
  throw new Error("MONGODB_TLS_ALLOW_INVALID_CERTS must not be true in production.");
}

if (config.nodeEnv === "production" && !config.appPassword) {
  throw new Error("APP_PASSWORD must be set in production.");
}

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = valueParts.join("=").trim();
  }
}

module.exports = { config };
