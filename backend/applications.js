const { connectDb } = require("./db");
const { normalizeApplication, validateApplicationId } = require("./validation");

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
  return applications.findOne({ id: validateApplicationId(id) }, { projection: { _id: 0 } });
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
  const cleanId = validateApplicationId(id);
  const existing = await getApplication(cleanId);
  if (!existing) return null;

  const app = normalizeApplication({
    ...existing,
    ...payload,
    id: cleanId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  await applications.updateOne({ id: cleanId }, { $set: app });
  return getApplication(cleanId);
}

async function deleteApplication(id) {
  const applications = await collection();
  const result = await applications.deleteOne({ id: validateApplicationId(id) });
  return result.deletedCount > 0;
}

module.exports = {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
};
