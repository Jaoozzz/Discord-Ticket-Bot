const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { countOpenTickets } = require("../utils/db");
const { loadConfig, getAccent } = require("../utils/configStore");
const { getStats } = require("../utils/ratings");
const { listBlocked } = require("../utils/blacklistTickets");
const { listOpenMetas } = require("../utils/ticketManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Estatísticas de tickets e avaliações"),

  async run(client, interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
    }

    const cfg = loadConfig();
    const open = listOpenMetas().length;
    const ratings = getStats();
    const bl = listBlocked().length;
    const free = listOpenMetas().filter(m => !m.claimedBy).length;

    const embed = new EmbedBuilder()
      .setColor(getAccent(cfg))
      .setTitle(`📊 Stats · ${cfg.brand}`)
      .addFields(
        { name: "Tickets abertos", value: `\`${open}\``, inline: true },
        { name: "Sem atendente", value: `\`${free}\``, inline: true },
        { name: "Blacklist", value: `\`${bl}\``, inline: true },
        { name: "Avaliações", value: `\`${ratings.count}\``, inline: true },
        { name: "Média", value: `\`${ratings.avg || "—"}\``, inline: true },
        { name: "Modo painel", value: `\`${cfg.panelMode}\``, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
