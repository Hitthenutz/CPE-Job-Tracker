const { MongoClient } = require("mongodb");
const { config } = require("./config");

let client;
let database;

async function connectDb() {
  if (database) return database;

  client = new MongoClient(config.mongodbUri);
  await client.connect();
  database = client.db(config.dbName);
  await ensureIndexes(database);
  await seedIfEmpty(database);
  return database;
}

async function ensureIndexes(db) {
  await db.collection("applications").createIndexes([
    { key: { id: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { priority: 1 } },
    { key: { followUpDate: 1 } },
    { key: { updatedAt: -1 } },
  ]);
}

async function seedIfEmpty(db) {
  const applications = db.collection("applications");
  const count = await applications.countDocuments();
  if (count > 0) return;

  const now = new Date().toISOString();
  await applications.insertMany([
    {
      id: crypto.randomUUID(),
      company: "NVIDIA",
      role: "Computer Engineering Intern",
      type: "Internship",
      priority: "High",
      status: "Applied",
      dateApplied: "2026-06-02",
      deadline: "2026-06-20",
      location: "Santa Clara, CA",
      mode: "Hybrid",
      link: "https://careers.nvidia.com",
      contact: "Recruiter",
      referral: "Needed",
      nextStep: "Ask alumni for referral",
      followUpDate: "2026-06-09",
      compensation: "$30/hr",
      notes: "Embedded systems and hardware track.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      company: "AMD",
      role: "Silicon Validation Co-op",
      type: "Co-op",
      priority: "Medium",
      status: "Interview",
      dateApplied: "2026-05-28",
      deadline: "",
      location: "Austin, TX",
      mode: "Office",
      link: "https://careers.amd.com",
      contact: "",
      referral: "No",
      nextStep: "Prepare verification stories",
      followUpDate: "2026-06-05",
      compensation: "",
      notes: "Review digital logic and lab projects.",
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

async function closeDb() {
  if (!client) return;
  await client.close();
  client = undefined;
  database = undefined;
}

module.exports = { closeDb, connectDb };
