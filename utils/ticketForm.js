const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");
const { loadConfig } = require("./configStore");

/**
 * Modal de formulário ao abrir ticket.
 * customId: ticket_form_{typeId}
 */
function buildOpenFormModal(typeId, typeLabel, guildId) {
  const cfg = loadConfig(guildId);
  const title = `Abrir · ${(typeLabel || typeId || "Ticket").slice(0, 30)}`;

  const modal = new ModalBuilder()
    .setCustomId(`ticket_form_${typeId}`)
    .setTitle(title.slice(0, 45));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("subject")
        .setLabel("Assunto (resumo)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ex: Erro ao instalar o bot X")
        .setRequired(true)
        .setMaxLength(100)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("details")
        .setLabel("Detalhes")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Explique o que precisa, já tentou o quê, prints se tiver…")
        .setRequired(true)
        .setMaxLength(1000)
    )
  );

  // campo extra opcional se configurado
  if (cfg.formExtraLabel) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("extra")
          .setLabel(String(cfg.formExtraLabel).slice(0, 45))
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
      )
    );
  }

  return modal;
}

function parseFormModal(interaction) {
  const subject = interaction.fields.getTextInputValue("subject")?.trim() || "";
  const details = interaction.fields.getTextInputValue("details")?.trim() || "";
  let extra = "";
  try {
    extra = interaction.fields.getTextInputValue("extra")?.trim() || "";
  } catch {}
  return {
    subject,
    details: extra ? `${details}\n\n(${extra})` : details
  };
}

module.exports = { buildOpenFormModal, parseFormModal };
