const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");
const { isOwner, isStaff } = require("../utils/permissions");
const { buildPublicPanel } = require("../utils/panelBuilder");
const { loadConfig } = require("../utils/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Publicar o painel de tickets neste canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async run(client, interaction) {
    if (!isStaff(interaction.member) && !isOwner(interaction.user.id)) {
      return interaction.reply({
        content: "Sem permissão.",
        ephemeral: true
      });
    }

    // garante guildId na config efetiva
    loadConfig(interaction.guild.id);

    await interaction.reply({
      content: "Painel publicado neste canal.",
      ephemeral: true
    });

    const payload = buildPublicPanel(interaction.guild);
    await interaction.channel.send(payload);
  }
};
