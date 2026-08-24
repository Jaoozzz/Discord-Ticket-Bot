const { EmbedBuilder } = require("discord.js");
const { loadConfig } = require("./configStore");
const { getTicketMeta, setTicketMeta, listOpenChannelIds } = require("./db");

function touchActivity(channelId) {
  setTicketMeta(channelId, {
    lastActivity: Date.now(),
    warnedInactive: false
  });
}

async function checkInactive(client) {
  const channels = listOpenChannelIds();
  for (const channelId of channels) {
    try {
      const meta = getTicketMeta(channelId);
      if (!meta || meta.closed) continue;

      const cfg = loadConfig(meta.guildId);
      const ac = cfg.autoClose;
      if (!ac || !ac.enabled) continue;

      const warnMs = (ac.warnMinutes || 120) * 60 * 1000;
      const closeMs = (ac.closeMinutes || 180) * 60 * 1000;
      const last = meta.lastActivity || meta.createdAt || Date.now();
      const idle = Date.now() - last;

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) continue;

      if (idle >= closeMs) {
        await channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xed4245)
                .setTitle("Ticket encerrado por inatividade")
                .setDescription("Não houve mensagens no tempo configurado.")
                .setTimestamp()
            ]
          })
          .catch(() => {});
        const { closeTicket } = require("./ticketManager");
        await closeTicket(channel, client.user, { reason: "inatividade" });
        continue;
      }

      if (idle >= warnMs && !meta.warnedInactive) {
        setTicketMeta(channelId, { warnedInactive: true });
        await channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xfee75c)
                .setTitle("Ticket inativo")
                .setDescription(
                  "Sem atividade há algum tempo. Se ninguém responder, o ticket será **fechado automaticamente**."
                )
                .setTimestamp()
            ]
          })
          .catch(() => {});
      }
    } catch (e) {
      console.error("[autoClose]", channelId, e.message);
    }
  }
}

function startAutoClose(client) {
  setInterval(() => checkInactive(client), 5 * 60 * 1000);
  setTimeout(() => checkInactive(client), 60 * 1000);
}

module.exports = { startAutoClose, touchActivity, checkInactive };
