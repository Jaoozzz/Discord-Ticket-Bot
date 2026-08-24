const fs = require("fs");
const path = require("path");

const GLOBAL_PATH = path.join(__dirname, "../config.json");
const GUILDS_DIR = path.join(__dirname, "../database/guilds");

function ensureDir() {
  if (!fs.existsSync(GUILDS_DIR)) fs.mkdirSync(GUILDS_DIR, { recursive: true });
}

function readJson(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return structuredClone(fallback);
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return structuredClone(fallback);
  }
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadGlobal() {
  const raw = readJson(GLOBAL_PATH, {});
  if (typeof raw.ownerId === "string") raw.ownerId = [raw.ownerId];
  if (!Array.isArray(raw.ownerId)) raw.ownerId = [];
  return raw;
}

function guildPath(guildId) {
  return path.join(GUILDS_DIR, `${guildId}.json`);
}

/**
 * Config efetiva do servidor = global (token/defaults) + overrides do guild.
 * Campos sensíveis (token) só no global.
 */
function loadGuildConfig(guildId) {
  const global = loadGlobal();
  if (!guildId) return normalize(global);

  const local = readJson(guildPath(guildId), {});
  const merged = {
    ...global,
    ...local,
    token: global.token,
    clientId: global.clientId,
    ownerId: global.ownerId,
    guildId: guildId,
    // deep-ish merges
    ticketTypes: local.ticketTypes || global.ticketTypes || [],
    statusOptions: local.statusOptions || global.statusOptions || [],
    faq: local.faq || global.faq || [],
    businessHours: { ...(global.businessHours || {}), ...(local.businessHours || {}) },
    autoClose: { ...(global.autoClose || {}), ...(local.autoClose || {}) },
    ticketButtons: { ...(global.ticketButtons || {}), ...(local.ticketButtons || {}) },
    formFields: local.formFields || global.formFields || null,
    sla: { ...(global.sla || {}), ...(local.sla || {}) }
  };
  return normalize(merged);
}

function normalize(cfg) {
  if (!cfg.panelMode) cfg.panelMode = "both";
  if (!cfg.maxTicketsPerUser) cfg.maxTicketsPerUser = 2;
  if (!cfg.brand) cfg.brand = "Bot Ticket";
  if (!cfg.accentColor) cfg.accentColor = "0b0b0b";
  if (!Array.isArray(cfg.ticketTypes)) cfg.ticketTypes = [];
  if (!Array.isArray(cfg.statusOptions)) cfg.statusOptions = [];
  if (!Array.isArray(cfg.faq)) cfg.faq = [];
  if (!cfg.sla) cfg.sla = { enabled: true, minutes: 15 };
  if (!cfg.formEnabled) cfg.formEnabled = true;
  return cfg;
}

function saveGuildConfig(guildId, patch) {
  if (!guildId) {
    const g = loadGlobal();
    const next = { ...g, ...patch };
    // never strip token accidentally
    if (!next.token) next.token = g.token;
    writeJson(GLOBAL_PATH, next);
    clearRequireCache();
    return next;
  }
  const prev = readJson(guildPath(guildId), {});
  const next = { ...prev, ...patch };
  // don't store token in guild file
  delete next.token;
  writeJson(guildPath(guildId), next);
  return loadGuildConfig(guildId);
}

function clearRequireCache() {
  try {
    delete require.cache[require.resolve("../config.json")];
  } catch {}
}

module.exports = {
  loadGlobal,
  loadGuildConfig,
  saveGuildConfig,
  GUILDS_DIR
};
