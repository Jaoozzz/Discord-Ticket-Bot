const { EmbedBuilder } = require("discord.js");
const { getOwner, getTicketMeta, setTicketMeta } = require("../utils/db");
const { isStaff } = require("../utils/permissions");
const { claimTicket, refreshPanel, logTicket } = require("../utils/ticketManager");
const { loadConfig } = require("../utils/configStore");
const { touchActivity } = require("../utils/autoClose");

module.exports = client => {
  client.on("messageCreate", async message => {
    try {
      if (!message.guild || message.author.bot) return;
      const ownerId = getOwner(message.channel.id);
      if (!ownerId) return;

      const meta = getTicketMeta(message.channel.id);
      if (!meta || meta.closed) return;

      touchActivity(message.channel.id);

      const member = message.member;
      if (!member) return;

      const staff = isStaff(member);
      const cfg = loadConfig(message.guild.id);

      // claim automático na 1ª msg da staff
      if (staff && !meta.claimedBy && cfg.autoClaim !== false) {
        await claimTicket(message.channel, message.author);
        await message.channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x57f287)
                .setDescription(`**${message.author.username}** assumiu o ticket automaticamente.`)
            ]
          })
          .catch(() => {});
      }

      // SLA — primeira resposta da staff
      if (staff && !meta.firstStaffReplyAt) {
        setTicketMeta(message.channel.id, {
          firstStaffReplyAt: Date.now(),
          lastActivity: Date.now()
        });
        await refreshPanel(message.channel).catch(() => {});
      }
    } catch (e) {
      console.error("[messageCreate]", e.message);
    }
  });
};
