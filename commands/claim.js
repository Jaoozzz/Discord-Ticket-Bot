const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getOwner } = require("../utils/db");
const { claimTicket } = require("../utils/ticketManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Assumir este ticket"),

  async run(client, interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "Apenas staff.", ephemeral: true });
    }
    if (!getOwner(interaction.channel.id)) {
      return interaction.reply({ content: "Este canal não é um ticket.", ephemeral: true });
    }

    await claimTicket(interaction.channel, interaction.user);
    await interaction.reply(`**${interaction.user.username}** assumiu o ticket.`);
  }
};
