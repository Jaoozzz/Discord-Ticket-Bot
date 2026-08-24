const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getOwner } = require("../utils/db");
const { removeMemberFromTicket } = require("../utils/ticketManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remover alguém do ticket")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuário").setRequired(true)
    ),

  async run(client, interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "Apenas staff.", ephemeral: true });
    }
    if (!getOwner(interaction.channel.id)) {
      return interaction.reply({ content: "Este canal não é um ticket.", ephemeral: true });
    }

    const user = interaction.options.getUser("usuario");
    try {
      await removeMemberFromTicket(interaction.channel, user.id);
      await interaction.reply(`${user} removido do ticket.`);
    } catch (e) {
      await interaction.reply({ content: e.message, ephemeral: true });
    }
  }
};
