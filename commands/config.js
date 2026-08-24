const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isOwner } = require("../utils/permissions");
const { homePanel } = require("../utils/configUI");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Painel visual de configuração do bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async run(client, interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: "Apenas o dono pode usar `/config`.",
        flags: MessageFlags.Ephemeral
      });
    }

    const panel = homePanel();
    await interaction.reply({
      embeds: panel.embeds,
      components: panel.components,
      flags: MessageFlags.Ephemeral
    });
  }
};
