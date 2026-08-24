const path = require("path");
const { loadGlobal, loadGuildConfig, saveGuildConfig } = require("./guildConfig");

const CONFIG_PATH = path.join(__dirname, "../config.json");

/** @deprecated use loadGuildConfig(guildId) — mantido p/ compat */
function loadConfig(guildId = null) {
  if (guildId) return loadGuildConfig(guildId);
  return loadGuildConfig(null);
}

function saveConfig(cfg, guildId = null) {
  const gid = guildId || cfg.guildId || null;
  // se tem guildId, salva só overrides locais
  if (gid) {
    const {
      token,
      clientId,
      ownerId,
      ...local
    } = cfg;
    return saveGuildConfig(gid, local);
  }
  return saveGuildConfig(null, cfg);
}

function getAccent(cfg) {
  const hex = String(cfg.accentColor || "2b2d31").replace("#", "");
  return parseInt(hex, 16) || 0x2b2d31;
}

function getTicketType(cfg, id) {
  return (cfg.ticketTypes || []).find(t => t.id === id) || null;
}

function legacyTypeMap(customId) {
  if (customId === "abrir_ticket") return "atendimento";
  if (customId === "abrir_ticket_clothes") return "clothes";
  if (customId.startsWith("abrir_ticket:")) return customId.split(":")[1];
  if (customId.startsWith("ticket_btn_")) return customId.replace("ticket_btn_", "");
  return null;
}

module.exports = {
  loadConfig,
  saveConfig,
  getAccent,
  getTicketType,
  legacyTypeMap,
  CONFIG_PATH,
  loadGuildConfig,
  saveGuildConfig
};
