const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getOwner } = require("../utils/db");
const { renameTicket } = require("../utils/ticketManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rename")
    .setDescription("Renomear o canal do ticket")
    .addStringOption(o =>
      o.setName("nome").setDescription("Novo nome").setRequired(true).setMaxLength(90)
    ),

  async run(client, interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "Apenas staff.", ephemeral: true });
    }
    if (!getOwner(interaction.channel.id)) {
      return interaction.reply({ content: "Este canal não é um ticket.", ephemeral: true });
    }

    const nome = interaction.options.getString("nome");
    await renameTicket(interaction.channel, nome);
    await interaction.reply(`Canal renomeado.`);
  }
};
