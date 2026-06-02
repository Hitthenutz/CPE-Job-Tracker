const { badRequest } = require("./errors");

const allowedValues = {
  type: new Set(["Internship", "Co-op", "New Grad", "Part-time", "Research"]),
  priority: new Set(["High", "Medium", "Low"]),
  status: new Set(["Not Started", "Applied", "OA", "Phone Screen", "Interview", "Final Round", "Offer", "Rejected", "Withdrawn", "Ghosted", "Accepted"]),
  mode: new Set(["Office", "On-site", "Hybrid", "Remote", "Flexible", "Unknown"]),
  referral: new Set(["Yes", "No", "Needed"]),
};

const maxLengths = {
  company: 120,
  role: 160,
  location: 120,
  link: 500,
  contact: 120,
  nextStep: 240,
  compensation: 80,
  notes: 2000,
};

function normalizeApplication(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw badRequest("Application payload must be an object.");
  }

  const app = {
    id: clean(input.id),
    company: clean(input.company),
    role: clean(input.role),
    type: clean(input.type) || "Internship",
    priority: clean(input.priority) || "Medium",
    status: clean(input.status) || "Not Started",
    dateApplied: clean(input.dateApplied),
    deadline: clean(input.deadline),
    location: clean(input.location),
    mode: clean(input.mode) || "Hybrid",
    link: clean(input.link),
    contact: clean(input.contact),
    referral: clean(input.referral) || "No",
    nextStep: clean(input.nextStep),
    followUpDate: clean(input.followUpDate),
    compensation: clean(input.compensation),
    notes: clean(input.notes),
    createdAt: clean(input.createdAt),
    updatedAt: clean(input.updatedAt),
  };

  requireText(app.company, "Company");
  requireText(app.role, "Role");
  validateChoice(app.type, "type");
  validateChoice(app.priority, "priority");
  validateChoice(app.status, "status");
  validateChoice(app.mode, "mode");
  validateChoice(app.referral, "referral");
  validateDate(app.dateApplied, "Date applied");
  validateDate(app.deadline, "Deadline");
  validateDate(app.followUpDate, "Follow-up date");
  validateUrl(app.link);
  validateLengths(app);

  return app;
}

function validateApplicationId(id) {
  const cleanId = clean(id);
  if (!/^[a-f0-9-]{36}$/i.test(cleanId)) {
    throw badRequest("Invalid application id.");
  }
  return cleanId;
}

function clean(value) {
  return String(value ?? "").trim();
}

function requireText(value, label) {
  if (!value) {
    throw badRequest(`${label} is required.`);
  }
}

function validateChoice(value, key) {
  if (!allowedValues[key].has(value)) {
    throw badRequest(`Invalid ${key}.`);
  }
}

function validateDate(value, label) {
  if (!value) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest(`${label} must use YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || value !== date.toISOString().slice(0, 10)) {
    throw badRequest(`${label} is not a valid date.`);
  }
}

function validateUrl(value) {
  if (!value) return;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw badRequest("Link must be a valid URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw badRequest("Link must use http or https.");
  }
}

function validateLengths(app) {
  for (const [key, max] of Object.entries(maxLengths)) {
    if (app[key].length > max) {
      throw badRequest(`${key} must be ${max} characters or fewer.`);
    }
  }
}

module.exports = { normalizeApplication, validateApplicationId };
