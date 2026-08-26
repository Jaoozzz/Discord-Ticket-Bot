const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../database/ticketBlacklist.json");

function key(guildId, userId) {
  return `${guildId || "global"}:${userId}`;
}

function load() {
  try {
    if (!fs.existsSync(FILE)) return { users: {} };
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { users: {} };
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function isBlocked(userId, guildId) {
  const data = load();
  const k = key(guildId, userId);
  const entry = data.users[k];
  if (!entry) return null;
  if (entry.until && entry.until < Date.now()) {
    delete data.users[k];
    save(data);
    return null;
  }
  return entry;
}

function block(userId, { reason, until, by, guildId } = {}) {
  const data = load();
  data.users[key(guildId, userId)] = {
    userId,
    guildId: guildId || null,
    reason: reason || "Sem motivo",
    until: until || null,
    by: by || null,
    at: Date.now()
  };
  save(data);
}

function unblock(userId, guildId) {
  const data = load();
  const k = key(guildId, userId);
  if (!data.users[k]) return false;
  delete data.users[k];
  save(data);
  return true;
}

function listBlocked(guildId) {
  const data = load();
  return Object.values(data.users).filter(
    v => !guildId || v.guildId === guildId
  );
}

module.exports = { isBlocked, block, unblock, listBlocked };
