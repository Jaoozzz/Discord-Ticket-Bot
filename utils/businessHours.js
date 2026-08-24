const { loadConfig } = require("./configStore");

/**
 * hours config:
 * businessHours: {
 *   enabled: true,
 *   timezoneOffset: -3,
 *   days: [1,2,3,4,5], // 0=dom .. 6=sab
 *   open: "09:00",
 *   close: "18:00",
 *   message: "Fora do horário..."
 * }
 */
function isWithinBusinessHours(cfg = loadConfig()) {
  const bh = cfg.businessHours;
  if (!bh || !bh.enabled) return { ok: true };

  const offset = Number(bh.timezoneOffset ?? -3);
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + offset * 3600000);

  const day = local.getDay();
  const days = bh.days || [1, 2, 3, 4, 5];
  if (!days.includes(day)) {
    return {
      ok: false,
      message: bh.message || "Estamos fechados neste dia. Tente no horário comercial."
    };
  }

  const [oh, om] = String(bh.open || "09:00").split(":").map(Number);
  const [ch, cm] = String(bh.close || "18:00").split(":").map(Number);
  const mins = local.getHours() * 60 + local.getMinutes();
  const openM = oh * 60 + (om || 0);
  const closeM = ch * 60 + (cm || 0);

  if (mins < openM || mins >= closeM) {
    return {
      ok: false,
      message:
        bh.message ||
        `Fora do horário de atendimento (**${bh.open}–${bh.close}**).`
    };
  }

  return { ok: true };
}

module.exports = { isWithinBusinessHours };
