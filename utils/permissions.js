const { PermissionFlagsBits } = require("discord.js");
const { loadConfig } = require("./configStore");

function isOwner(userId) {
  const cfg = loadConfig();
  return (cfg.ownerId || []).includes(userId);
}

function isStaff(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  const cfg = loadConfig();
  if (cfg.staffRole && member.roles?.cache?.has(cfg.staffRole)) return true;
  return false;
}

module.exports = { isOwner, isStaff };
