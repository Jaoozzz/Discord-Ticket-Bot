const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BACKUP_DIR = path.join(ROOT, "backups");

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupNow() {
  ensureDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(BACKUP_DIR, stamp);
  fs.mkdirSync(dir, { recursive: true });

  const files = [
    "config.json",
    "database/tickets.json",
    "database/ratings.json",
    "database/ticketBlacklist.json"
  ];

  for (const f of files) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) {
      const dest = path.join(dir, path.basename(f));
      fs.copyFileSync(src, dest);
    }
  }

  // limpa backups antigos (mantém 10)
  const all = fs.readdirSync(BACKUP_DIR).sort().reverse();
  for (const old of all.slice(10)) {
    try {
      fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true });
    } catch {}
  }

  return dir;
}

function startBackupInterval(hours = 6) {
  backupNow();
  setInterval(() => {
    try {
      backupNow();
      console.log("[backup] snapshot salvo");
    } catch (e) {
      console.error("[backup]", e.message);
    }
  }, hours * 3600000);
}

module.exports = { backupNow, startBackupInterval };
