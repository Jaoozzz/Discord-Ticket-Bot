const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { isOwner, isStaff } = require("../utils/permissions");
const { block, unblock, listBlocked, isBlocked } = require("../utils/blacklistTickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Bloquear usuários de abrir tickets")
    .addSubcommand(s =>
      s
        .setName("add")
        .setDescription("Bloquear usuário")
        .addUserOption(o =>
          o.setName("usuario").setDescription("Usuário a bloquear").setRequired(true)
        )
        .addStringOption(o => o.setName("motivo").setDescription("Motivo do bloqueio"))
        .addIntegerOption(o =>
          o
            .setName("dias")
            .setDescription("Duração em dias (vazio = permanente)")
            .setMinValue(1)
        )
    )
    .addSubcommand(s =>
      s
        .setName("remove")
        .setDescription("Desbloquear")
        .addUserOption(o =>
          o.setName("usuario").setDescription("Usuário a desbloquear").setRequired(true)
        )
    )
    .addSubcommand(s => s.setName("list").setDescription("Listar bloqueados"))
    .addSubcommand(s =>
      s
        .setName("check")
        .setDescription("Verificar usuário")
        .addUserOption(o =>
          o.setName("usuario").setDescription("Usuário a verificar").setRequired(true)
        )
    ),

  async run(client, interaction) {
    if (!isStaff(interaction.member) && !isOwner(interaction.user.id)) {
      return interaction.reply({ content: "Sem permissão.", flags: MessageFlags.Ephemeral });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const user = interaction.options.getUser("usuario");
      const motivo = interaction.options.getString("motivo") || "Sem motivo";
      const dias = interaction.options.getInteger("dias");
      const until = dias ? Date.now() + dias * 86400000 : null;
      block(user.id, { reason: motivo, until, by: interaction.user.id });
      return interaction.reply({
        content: `${user} bloqueado.\nMotivo: ${motivo}${dias ? `\nDias: ${dias}` : "\nPermanente"}`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === "remove") {
      const user = interaction.options.getUser("usuario");
      const ok = unblock(user.id);
      return interaction.reply({
        content: ok ? `${user} desbloqueado.` : "Não estava na blacklist.",
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === "list") {
      const list = listBlocked();
      const text =
        list
          .slice(0, 30)
          .map(
            u =>
              `• <@${u.userId}> — ${u.reason}${
                u.until ? ` · até <t:${Math.floor(u.until / 1000)}:d>` : " · perm"
              }`
          )
          .join("\n") || "_Vazia_";
      return interaction.reply({ content: `### Blacklist\n${text}`, flags: MessageFlags.Ephemeral });
    }

    if (sub === "check") {
      const user = interaction.options.getUser("usuario");
      const e = isBlocked(user.id);
      return interaction.reply({
        content: e
          ? `${user} bloqueado: **${e.reason}**`
          : `${user} não está bloqueado.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
