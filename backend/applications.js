const { connectDb } = require("./db");

async function collection() {
  const db = await connectDb();
  return db.collection("applications");
}

async function listApplications() {
  const applications = await collection();
  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  const rows = await applications
    .find({}, { projection: { _id: 0 } })
    .sort({ followUpDate: 1, updatedAt: -1 })
    .toArray();

  return rows.sort((a, b) => {
    const priorityDelta = (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9);
    if (priorityDelta) return priorityDelta;
    return String(a.followUpDate || "").localeCompare(String(b.followUpDate || ""));
  });
}

async function getApplication(id) {
  const applications = await collection();
  return applications.findOne({ id }, { projection: { _id: 0 } });
}

async function createApplication(payload) {
  const applications = await collection();
  const now = new Date().toISOString();
  const app = normalizeApplication({
    ...payload,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });

  await applications.insertOne(app);
  return getApplication(app.id);
}

async function updateApplication(id, payload) {
  const applications = await collection();
  const existing = await getApplication(id);
  if (!existing) return null;

  const app = normalizeApplication({
    ...existing,
    ...payload,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  await applications.updateOne({ id }, { $set: app });
  return getApplication(id);
}

async function deleteApplication(id) {
  const applications = await collection();
  const result = await applications.deleteOne({ id });
  return result.deletedCount > 0;
}

function normalizeApplication(input) {
  const app = {
    id: String(input.id || ""),
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

  if (!app.company || !app.role) {
    throw new Error("Company and role are required.");
  }

  return app;
}

function clean(value) {
  return String(value ?? "").trim();
}

module.exports = {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
};
