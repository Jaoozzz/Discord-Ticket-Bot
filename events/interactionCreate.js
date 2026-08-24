const {
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  UserSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");
const { loadConfig, legacyTypeMap, getTicketType, getAccent } = require("../utils/configStore");
const { isStaff, isOwner } = require("../utils/permissions");
const {
  getOwner,
  getTicketMeta,
  setStatus,
  setTicketMeta,
  addNote,
  getNotes
} = require("../utils/db");
const {
  openTicket,
  closeTicket,
  claimTicket,
  transferTicket,
  setPriority,
  refreshPanel,
  addMemberToTicket,
  logTicket
} = require("../utils/ticketManager");
const { buildStatusSelect, buildPrioritySelect } = require("../utils/ticketEmbed");
const { buildTranscript, buildTranscriptHtml } = require("../utils/transcript");
const { addRating } = require("../utils/ratings");
const { buildOpenFormModal, parseFormModal } = require("../utils/ticketForm");
const {
  handleConfigButton,
  handleConfigSelect,
  handleConfigModal
} = require("../utils/configHandlers");

function canManageTicket(member, channelId) {
  if (isStaff(member) || isOwner(member.id)) return true;
  const cfg = loadConfig(member.guild?.id);
  if (cfg.allowOwnerClose && getOwner(channelId) === member.id) return "close_only";
  return false;
}

async function beginOpen(interaction, typeId) {
  const cfg = loadConfig(interaction.guild.id);
  const type = getTicketType(cfg, typeId);

  if (cfg.formEnabled !== false) {
    const modal = buildOpenFormModal(typeId, type?.label, interaction.guild.id);
    return interaction.showModal(modal);
  }
  return openTicket(interaction, typeId);
}

module.exports = client => {
  client.on("interactionCreate", async interaction => {
    try {
      // ── Config ─────────────────────────────────────────────
      if (interaction.isModalSubmit() && interaction.customId.startsWith("cfg_")) {
        const h = await handleConfigModal(interaction);
        if (h !== false) return;
      }
      if (interaction.isButton() && interaction.customId.startsWith("cfg_")) {
        const h = await handleConfigButton(interaction);
        if (h !== false) return;
      }
      if (
        (interaction.isStringSelectMenu() ||
          interaction.isChannelSelectMenu() ||
          interaction.isRoleSelectMenu()) &&
        interaction.customId.startsWith("cfg_")
      ) {
        const h = await handleConfigSelect(interaction);
        if (h !== false) return;
      }

      // ── Form open ticket ───────────────────────────────────
      if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_form_")) {
        const typeId = interaction.customId.replace("ticket_form_", "");
        const form = parseFormModal(interaction);
        return openTicket(interaction, typeId, form);
      }

      // ── Note modal ─────────────────────────────────────────
      if (interaction.isModalSubmit() && interaction.customId === "ticket_modal_note") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const content = interaction.fields.getTextInputValue("note").trim();
        addNote(interaction.channel.id, interaction.user.id, content);
        return interaction.reply({
          content: "Nota interna salva (só staff vê em **Ver notas**).",
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.isModalSubmit() && interaction.customId === "ticket_modal_add_user") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const id = interaction.fields.getTextInputValue("user_id").trim();
        await addMemberToTicket(interaction.channel, id);
        return interaction.reply(`<@${id}> adicionado ao ticket.`);
      }

      // Transfer user select
      if (interaction.isUserSelectMenu() && interaction.customId === "ticket_transfer_select") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const userId = interaction.values[0];
        await transferTicket(interaction.channel, interaction.user, userId);
        return interaction.update({
          content: `Transferido para <@${userId}>.`,
          embeds: [],
          components: []
        });
      }

      // Slash
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        return await cmd.run(client, interaction);
      }

      // FAQ
      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_faq_select") {
        const cfg = loadConfig(interaction.guild.id);
        const idx = Number(interaction.values[0]);
        const item = (cfg.faq || [])[idx];
        if (!item) {
          return interaction.reply({ content: "FAQ não encontrada.", flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(getAccent(cfg))
              .setTitle(item.question)
              .setDescription(item.answer || "—")
              .setFooter({ text: "Se ainda precisar, abra um ticket abaixo." })
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      // Open ticket select / buttons → form
      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_open_select") {
        return beginOpen(interaction, interaction.values[0]);
      }
      if (interaction.isButton()) {
        const legacy = legacyTypeMap(interaction.customId);
        if (legacy || interaction.customId.startsWith("ticket_btn_")) {
          const typeId = legacy || interaction.customId.replace("ticket_btn_", "");
          return beginOpen(interaction, typeId);
        }
      }

      // Rating
      if (interaction.isButton() && interaction.customId.startsWith("ticket_rate_")) {
        const parts = interaction.customId.split("_");
        const stars = Number(parts[parts.length - 1]);
        const channelId = parts.slice(2, -1).join("_");
        if (!stars || stars < 1 || stars > 5) {
          return interaction.reply({ content: "Inválido.", flags: MessageFlags.Ephemeral });
        }
        const meta = getTicketMeta(channelId) || {};
        addRating({
          userId: interaction.user.id,
          staffId: meta.claimedBy,
          stars,
          channelId,
          typeLabel: meta.typeLabel,
          guildId: meta.guildId
        });
        await logTicket(interaction.client, {
          guildId: meta.guildId,
          title: "Avaliação",
          description: `Avaliação **${stars}/5** por <@${interaction.user.id}>${
            meta.claimedBy ? ` · staff <@${meta.claimedBy}>` : ""
          }`,
          color: 0xfee75c
        });
        return interaction.update({
          content: `Obrigado! Você avaliou com **${stars}/5**.\nSe quiser, responda esta DM com um comentário extra.`,
          embeds: [],
          components: []
        });
      }

      // Claim
      if (interaction.isButton() && interaction.customId === "ticket_claim") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        if (!getOwner(interaction.channel.id)) {
          return interaction.reply({ content: "Canal inválido.", flags: MessageFlags.Ephemeral });
        }
        await claimTicket(interaction.channel, interaction.user);
        return interaction.reply(`**${interaction.user.username}** assumiu o ticket.`);
      }

      // Transfer
      if (interaction.isButton() && interaction.customId === "ticket_transfer") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({
          content: "Selecione o staff:",
          components: [
            new ActionRowBuilder().addComponents(
              new UserSelectMenuBuilder()
                .setCustomId("ticket_transfer_select")
                .setPlaceholder("Transferir para...")
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      // Priority
      if (interaction.isButton() && interaction.customId === "ticket_priority") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        return interaction.reply(buildPrioritySelect());
      }
      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_priority_select") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Sem permissão.", flags: MessageFlags.Ephemeral });
        }
        await setPriority(interaction.channel, interaction.values[0]);
        return interaction.update({ content: "Prioridade atualizada.", embeds: [], components: [] });
      }

      // Status
      if (interaction.isButton() && interaction.customId === "ticket_status") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        return interaction.reply(buildStatusSelect(loadConfig(interaction.guild.id)));
      }
      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_status_select") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Sem permissão.", flags: MessageFlags.Ephemeral });
        }
        setStatus(interaction.channel.id, interaction.values[0]);
        setTicketMeta(interaction.channel.id, { lastActivity: Date.now() });
        await refreshPanel(interaction.channel);
        return interaction.update({
          content: `Status → **${interaction.values[0]}**`,
          embeds: [],
          components: []
        });
      }

      // Notify
      if (interaction.isButton() && interaction.customId === "notificar") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const dono = getOwner(interaction.channel.id);
        if (!dono) {
          return interaction.reply({ content: "Dono não encontrado.", flags: MessageFlags.Ephemeral });
        }
        try {
          const user = await interaction.client.users.fetch(dono);
          const cfg = loadConfig(interaction.guild.id);
          await user.send(
            `📬 **${cfg.brand || "Ticket"}** — a equipe te chamou: ${interaction.channel}`
          );
          return interaction.reply({
            content: "Usuário notificado.",
            flags: MessageFlags.Ephemeral
          });
        } catch {
          return interaction.reply({ content: "DM fechada.", flags: MessageFlags.Ephemeral });
        }
      }

      // Add user
      if (interaction.isButton() && interaction.customId === "ticket_add_user") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const modal = new ModalBuilder()
          .setCustomId("ticket_modal_add_user")
          .setTitle("Adicionar usuário")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("user_id")
                .setLabel("ID do usuário")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );
        return interaction.showModal(modal);
      }

      // Internal note
      if (interaction.isButton() && interaction.customId === "ticket_note") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const modal = new ModalBuilder()
          .setCustomId("ticket_modal_note")
          .setTitle("Nota interna (só staff)")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("note")
                .setLabel("Nota (cliente NÃO vê)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000)
            )
          );
        return interaction.showModal(modal);
      }

      if (interaction.isButton() && interaction.customId === "ticket_notes_view") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        const notes = getNotes(interaction.channel.id, 15);
        const cfg = loadConfig(interaction.guild.id);
        const text =
          notes
            .map(
              n =>
                `• <@${n.author_id}> <t:${Math.floor(n.created_at / 1000)}:R>\n${n.content}`
            )
            .join("\n\n") || "_Nenhuma nota._";
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(getAccent(cfg))
              .setTitle("Notas internas")
              .setDescription(text.slice(0, 4000))
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      // Transcript
      if (interaction.isButton() && interaction.customId === "ticket_transcript") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({ content: "Apenas staff.", flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const meta = getTicketMeta(interaction.channel.id) || {};
        const txt = await buildTranscript(interaction.channel);
        const html = await buildTranscriptHtml(interaction.channel, meta);
        return interaction.editReply({
          content: `Transcript · **${txt.count}** msgs (TXT + HTML)`,
          files: [txt.file, html.file]
        });
      }

      // Info
      if (interaction.isButton() && interaction.customId === "ticket_info") {
        const ownerId = getOwner(interaction.channel.id);
        if (!ownerId) {
          return interaction.reply({ content: "Não é um ticket.", flags: MessageFlags.Ephemeral });
        }
        const meta = getTicketMeta(interaction.channel.id) || {};
        const { getQueuePosition } = require("../utils/ticketManager");
        const { priorityInfo } = require("../utils/ticketEmbed");
        const p = priorityInfo(meta.priority || "normal");
        const q = getQueuePosition(meta.typeId, interaction.channel.id, meta.guildId);
        return interaction.reply({
          content: [
            `**Tipo:** ${meta.typeLabel || "—"}`,
            `**Dono:** <@${ownerId}>`,
            `**Status:** ${meta.status || "Aguardando"}`,
            `**Prioridade:** ${p.label}`,
            `**Atendente:** ${meta.claimedBy ? `<@${meta.claimedBy}>` : "—"}`,
            `**Fila:** #${q}`,
            `**SLA 1ª resposta:** ${
              meta.firstStaffReplyAt
                ? `<t:${Math.floor(meta.firstStaffReplyAt / 1000)}:T>`
                : "pendente"
            }`,
            meta.formSubject ? `**Assunto:** ${meta.formSubject}` : null
          ]
            .filter(Boolean)
            .join("\n"),
          flags: MessageFlags.Ephemeral
        });
      }

      // Close
      if (interaction.isButton() && interaction.customId === "fechar_ticket") {
        const perm = canManageTicket(interaction.member, interaction.channel.id);
        if (!perm) {
          return interaction.reply({
            content: "Sem permissão para encerrar.",
            flags: MessageFlags.Ephemeral
          });
        }
        if (!getOwner(interaction.channel.id)) {
          return interaction.reply({ content: "Canal inválido.", flags: MessageFlags.Ephemeral });
        }
        const cfg = loadConfig(interaction.guild.id);
        const sec = cfg.closeDelaySeconds || 5;
        await interaction.reply(
          `Ticket encerrado por **${interaction.user.username}**. Some em **${sec}s**…`
        );
        return closeTicket(interaction.channel, interaction.user);
      }

      // Pix
      if (interaction.isButton() && interaction.customId === "qrcode") {
        const cfg = loadConfig(interaction.guild?.id);
        const payload = cfg.pixPayload || cfg.pixKey;
        if (!payload) {
          return interaction.reply({
            content: "Pix não configurado.",
            flags: MessageFlags.Ephemeral
          });
        }
        try {
          const makeQr = require("../utils/qrCode");
          const result = await makeQr(payload);
          return interaction.reply({
            content: `### Pix · ${cfg.brand || "Pagamento"}`,
            files: [result],
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          return interaction.reply({
            content: `Erro QR: ${e.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
    } catch (err) {
      console.error("[interactionCreate]", err);
      try {
        const msg = {
          content: `Erro: ${err.message || "ao processar"}`,
          flags: MessageFlags.Ephemeral
        };
        if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
        else await interaction.reply(msg);
      } catch {}
    }
  });
};
