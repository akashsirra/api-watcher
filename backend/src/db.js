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
`);

export function upsertSource(source){
  db.prepare(`INSERT INTO sources(slug,name,url) VALUES(@slug,@name,@url)
  ON CONFLICT(slug) DO UPDATE SET name=excluded.name,url=excluded.url`).run(source);
  return db.prepare("SELECT * FROM sources WHERE slug=?").get(source.slug);
}
