const { EmbedBuilder } = require("discord.js");
const { loadConfig } = require("./configStore");
const { listOpenTickets, setTicketMeta, getTicketMeta } = require("./db");
const { logTicket } = require("./ticketManager");

async function checkSla(client) {
  for (const t of listOpenTickets()) {
    try {
      if (t.closed || t.firstStaffReplyAt || t.warnedSla) continue;
      const cfg = loadConfig(t.guildId);
      const sla = cfg.sla || { enabled: true, minutes: 15 };
      if (sla.enabled === false) continue;

      const minutes = sla.minutes || 15;
      const age = Date.now() - (t.createdAt || Date.now());
      if (age < minutes * 60 * 1000) continue;

      const channel = await client.channels.fetch(t.channelId).catch(() => null);
      if (!channel) continue;

      setTicketMeta(t.channelId, { warnedSla: true });
      await channel
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xed4245)
              .setTitle("SLA estourado")
              .setDescription(
                `Nenhuma resposta da staff em **${minutes} minutos**.\nTipo: \`${t.typeLabel || "?"}\``
              )
              .setTimestamp()
          ]
        })
        .catch(() => {});

      await logTicket(client, {
        guildId: t.guildId,
        title: "SLA estourado",
        description: `${channel} sem 1ª resposta em ${minutes}m`,
        color: 0xed4245
      });
    } catch (e) {
      console.error("[sla]", e.message);
    }
  }
}

function startSlaChecker(client) {
  setInterval(() => checkSla(client), 60 * 1000);
  setTimeout(() => checkSla(client), 20 * 1000);
}

module.exports = { startSlaChecker, checkSla };
