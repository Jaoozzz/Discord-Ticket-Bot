const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getOwner } = require("../utils/db");
const { closeTicket } = require("../utils/ticketManager");
const { loadConfig } = require("../utils/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fechar")
    .setDescription("Encerrar o ticket deste canal"),

  async run(client, interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "Apenas staff.", ephemeral: true });
    }
    if (!getOwner(interaction.channel.id)) {
      return interaction.reply({
        content: "Este canal não é um ticket.",
        ephemeral: true
      });
    }

    const cfg = loadConfig();
    const sec = cfg.closeDelaySeconds || 5;
    await interaction.reply(`Ticket encerrado. Canal some em **${sec}s**…`);
    await closeTicket(interaction.channel, interaction.user);
  }
};
