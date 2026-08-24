const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getStaffTicketList } = require("../utils/ticketManager");
const { staffListEmbed } = require("../utils/ticketEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Painel da staff — tickets abertos e fila"),

  async run(client, interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
    }

    const list = getStaffTicketList(interaction.guild);
    const embed = staffListEmbed(list);

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};
