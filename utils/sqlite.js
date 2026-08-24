const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "../database");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = new Database(path.join(dir, "tickets.sqlite"));
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS tickets (
  channel_id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  type_id TEXT,
  type_label TEXT,
  status TEXT DEFAULT 'Aguardando',
  claimed_by TEXT,
  priority TEXT DEFAULT 'normal',
  include_pix INTEGER DEFAULT 0,
  panel_message_id TEXT,
  form_subject TEXT,
  form_details TEXT,
  created_at INTEGER,
  last_activity INTEGER,
  first_staff_reply_at INTEGER,
  warned_inactive INTEGER DEFAULT 0,
  warned_sla INTEGER DEFAULT 0,
  closed INTEGER DEFAULT 0,
  closed_at INTEGER,
  closed_by TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS user_tickets (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  PRIMARY KEY (guild_id, user_id, channel_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  channel_id TEXT,
  user_id TEXT,
  staff_id TEXT,
  stars INTEGER,
  comment TEXT,
  type_label TEXT,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
CREATE INDEX IF NOT EXISTS idx_tickets_open ON tickets(closed, guild_id);
`);

module.exports = { sqlite };
