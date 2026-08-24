const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getOwner } = require("../utils/db");
const { addMemberToTicket } = require("../utils/ticketManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adicionar alguém ao ticket")
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
    await addMemberToTicket(interaction.channel, user.id);
    await interaction.reply(`${user} adicionado ao ticket.`);
  }
};
