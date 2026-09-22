import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve("backend/data");
fs.mkdirSync(dataDir,{recursive:true});

export const db = new Database(path.join(dataDir,"api-watcher.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  last_hash TEXT,
  last_content TEXT,
  checked_at TEXT
);
CREATE TABLE IF NOT EXISTS changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  detected_at TEXT NOT NULL,
  previous_hash TEXT,
  current_hash TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id)
);
CREATE TABLE IF NOT EXISTS monitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  expected_status INTEGER NOT NULL DEFAULT 200,
  timeout_ms INTEGER NOT NULL DEFAULT 10000,
  headers_json TEXT NOT NULL DEFAULT '{}',
  body TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_checked_at TEXT,
  last_status TEXT,
  last_latency_ms INTEGER
);
CREATE TABLE IF NOT EXISTS uptime_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id INTEGER NOT NULL,
  checked_at TEXT NOT NULL,
  ok INTEGER NOT NULL,
  status_code INTEGER,
  latency_ms INTEGER,
  error TEXT,
  FOREIGN KEY(monitor_id) REFERENCES monitors(id)
);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_monitor_time ON uptime_checks(monitor_id,checked_at);
`);

export function upsertSource(source){
  db.prepare(`INSERT INTO sources(slug,name,url) VALUES(@slug,@name,@url)
  ON CONFLICT(slug) DO UPDATE SET name=excluded.name,url=excluded.url`).run(source);
  return db.prepare("SELECT * FROM sources WHERE slug=?").get(source.slug);
}
