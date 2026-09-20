import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, "../data");
const DB_FILE = path.join(DB_DIR, "jobs.json");

function ensureDataDir() {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function loadJobs() {
  ensureDataDir();

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function saveJobsFile(db) {
  const temp = path.join(DB_DIR, "jobs.tmp.json");

  fs.writeFileSync(
    temp,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(temp, DB_FILE);
}

export function saveJobs(jobs, successfulSources = []) {
  const db = loadJobs();
  const now = new Date().toISOString();
  const changes = [];

  const currentIds = new Set(
    jobs.map(job => String(job.id))
  );

  for (const job of jobs) {
    const id = String(job.id);
    const existing = db[id];

    const {
      description,
      ...storedJob
    } = job;

    if (!existing) {
      const record = {
        ...storedJob,
        first_seen: now,
        last_seen: now,
        status: "NEW"
      };

      db[id] = record;
      changes.push(record);
      continue;
    }

    const changed =
      existing.title !== job.title ||
      existing.location !== job.location ||
      existing.url !== job.url ||
      existing.updated_at !== job.updated_at ||
      existing.experience_level !== job.experience_level ||
      existing.job_type !== job.job_type;

    db[id] = {
      ...existing,
      ...storedJob,
      first_seen: existing.first_seen ?? now,
      last_seen: now,
      status: changed ? "UPDATED" : "UNCHANGED"
    };

    if (changed) {
      changes.push(db[id]);
    }
  }

  const successful = new Set(successfulSources);

  for (const [id, existing] of Object.entries(db)) {
    if (
      successful.has(existing.company) &&
      !currentIds.has(id) &&
      existing.status !== "CLOSED"
    ) {
      db[id] = {
        ...existing,
        status: "CLOSED",
        last_seen: now
      };

      changes.push(db[id]);
    }
  }

  saveJobsFile(db);

  return changes;
}

export default saveJobs;
