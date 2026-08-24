const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getOwner, getTicketMeta, getStatus } = require("../utils/db");
const { getQueuePosition } = require("../utils/ticketManager");
const { priorityInfo } = require("../utils/ticketEmbed");
const { loadConfig, getAccent } = require("../utils/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Informações do ticket")
    .addSubcommand(s => s.setName("info").setDescription("Ver info deste ticket")),

  async run(client, interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== "info") return;

    const ownerId = getOwner(interaction.channel.id);
    if (!ownerId) {
      return interaction.reply({
        content: "Este canal não é um ticket.",
        flags: MessageFlags.Ephemeral
      });
    }

    if (!isStaff(interaction.member) && interaction.user.id !== ownerId) {
      return interaction.reply({ content: "Sem permissão.", flags: MessageFlags.Ephemeral });
    }

    const meta = getTicketMeta(interaction.channel.id) || {};
    const cfg = loadConfig();
    const p = priorityInfo(meta.priority || "normal");
    const q = getQueuePosition(meta.typeId, interaction.channel.id);
    const created = meta.createdAt ? Math.floor(meta.createdAt / 1000) : null;

    const embed = new EmbedBuilder()
      .setColor(p.color)
      .setTitle(`ℹ️ Info · ${meta.typeLabel || "Ticket"}`)
      .addFields(
        { name: "Dono", value: `<@${ownerId}>`, inline: true },
        { name: "Status", value: `\`${getStatus(interaction.channel.id)}\``, inline: true },
        { name: "Prioridade", value: p.label, inline: true },
        { name: "Atendente", value: meta.claimedBy ? `<@${meta.claimedBy}>` : "`—`", inline: true },
        { name: "Fila", value: `#${q}`, inline: true },
        { name: "Tipo", value: `\`${meta.typeId || "?"}\``, inline: true },
        {
          name: "Aberto",
          value: created ? `<t:${created}:f> (<t:${created}:R>)` : "`—`",
          inline: false
        }
      )
      .setFooter({ text: cfg.brand || "Bot Ticket" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
