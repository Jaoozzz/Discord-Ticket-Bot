const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../database/ticketBlacklist.json");

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

function isBlocked(userId) {
  const data = load();
  const entry = data.users[userId];
  if (!entry) return null;
  if (entry.until && entry.until < Date.now()) {
    delete data.users[userId];
    save(data);
    return null;
  }
  return entry;
}

function block(userId, { reason, until, by } = {}) {
  const data = load();
  data.users[userId] = {
    reason: reason || "Sem motivo",
    until: until || null,
    by: by || null,
    at: Date.now()
  };
  save(data);
}

function unblock(userId) {
  const data = load();
  if (!data.users[userId]) return false;
  delete data.users[userId];
  save(data);
  return true;
}

function listBlocked() {
  const data = load();
  return Object.entries(data.users).map(([id, v]) => ({ userId: id, ...v }));
}

module.exports = { isBlocked, block, unblock, listBlocked };
