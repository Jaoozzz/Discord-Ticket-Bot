const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const { loadConfig, getAccent } = require("./configStore");

const PRIORITY = {
  baixa: { label: "Baixa", color: 0x95a5a6 },
  normal: { label: "Normal", color: 0x5865f2 },
  alta: { label: "Alta", color: 0xe67e22 },
  urgente: { label: "Urgente", color: 0xed4245 }
};

function priorityInfo(key) {
  return PRIORITY[key] || PRIORITY.normal;
}

function queuePosition(channelId, typeId) {
  // calculated externally; placeholder
  return null;
}

/**
 * Embed principal do ticket + botões de função.
 */
function buildTicketEmbed({
  user,
  typeLabel,
  status,
  claimedBy,
  priority = "normal",
  queuePos,
  createdAt,
  includePix,
  buttonsCfg,
  formSubject,
  formDetails,
  firstStaffReplyAt,
  slaMinutes
}) {
  const cfg = loadConfig();
  const brand = cfg.brand || "Bot Ticket";
  const p = priorityInfo(priority);
  const created = createdAt ? Math.floor(createdAt / 1000) : Math.floor(Date.now() / 1000);
  const sla = slaMinutes || cfg.sla?.minutes || 15;

  let slaText = "`Aguardando 1ª resposta`";
  if (firstStaffReplyAt) {
    const sec = Math.floor((firstStaffReplyAt - (createdAt || firstStaffReplyAt)) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    slaText = `OK em **${m}m ${s}s**`;
  } else if (createdAt) {
    const elapsed = Math.floor((Date.now() - createdAt) / 60000);
    slaText =
      elapsed >= sla
        ? `**${elapsed}m** (SLA ${sla}m estourado)`
        : `**${elapsed}m** / ${sla}m`;
  }

  const embed = new EmbedBuilder()
    .setColor(p.color)
    .setAuthor({
      name: `${brand} · Sistema de Tickets`,
      iconURL: cfg.iconUrl || undefined
    })
    .setTitle(`Ticket · ${typeLabel || "Geral"}`)
    .setDescription(
      [
        `Olá **${user.username}** — obrigado por abrir um atendimento.`,
        formSubject ? `\n**Assunto:** ${formSubject}` : null,
        "",
        "A equipe usa os botões abaixo para gerenciar este ticket.",
        includePix ? "Pagamento disponível em **Pix**." : null
      ]
        .filter(Boolean)
        .join("\n")
    )
    .addFields(
      { name: "Usuário", value: `${user}\n\`${user.id}\``, inline: true },
      { name: "Status", value: `\`${status || "Aguardando"}\``, inline: true },
      { name: "Prioridade", value: `**${p.label}**`, inline: true },
      {
        name: "Atendente",
        value: claimedBy ? `<@${claimedBy}>` : "`Ninguém assumiu`",
        inline: true
      },
      { name: "Tipo", value: `\`${typeLabel || "Geral"}\``, inline: true },
      { name: "Fila", value: queuePos ? `Posição **#${queuePos}**` : "`—`", inline: true },
      { name: "SLA", value: slaText, inline: true },
      {
        name: "Aberto em",
        value: `<t:${created}:f> · <t:${created}:R>`,
        inline: true
      }
    )
    .setFooter({ text: `${brand} · staff: notas internas · claim automático` })
    .setTimestamp();

  if (formDetails) {
    embed.addFields({ name: "Detalhes do form", value: formDetails.slice(0, 1024) });
  }

  if (cfg.bannerUrl) embed.setImage(cfg.bannerUrl);
  if (user.displayAvatarURL) {
    embed.setThumbnail(user.displayAvatarURL({ size: 256 }));
  }

  const b = buttonsCfg || cfg.ticketButtons || {};
  const show = key => b[key] !== false;

  // Botões sem emoji Unicode — só label (emoji custom opcional via config futura)
  const row1 = new ActionRowBuilder();
  if (show("claim"))
    row1.addComponents(
      new ButtonBuilder().setCustomId("ticket_claim").setLabel("Assumir").setStyle(ButtonStyle.Success)
    );
  if (show("transfer"))
    row1.addComponents(
      new ButtonBuilder().setCustomId("ticket_transfer").setLabel("Transferir").setStyle(ButtonStyle.Primary)
    );
  if (show("status"))
    row1.addComponents(
      new ButtonBuilder().setCustomId("ticket_status").setLabel("Status").setStyle(ButtonStyle.Secondary)
    );
  if (show("priority"))
    row1.addComponents(
      new ButtonBuilder().setCustomId("ticket_priority").setLabel("Prioridade").setStyle(ButtonStyle.Secondary)
    );

  const row2 = new ActionRowBuilder();
  if (show("notify"))
    row2.addComponents(
      new ButtonBuilder().setCustomId("notificar").setLabel("Notificar").setStyle(ButtonStyle.Secondary)
    );
  if (show("addUser"))
    row2.addComponents(
      new ButtonBuilder().setCustomId("ticket_add_user").setLabel("Add user").setStyle(ButtonStyle.Secondary)
    );
  if (includePix && show("pix"))
    row2.addComponents(
      new ButtonBuilder().setCustomId("qrcode").setLabel("Pix").setStyle(ButtonStyle.Success)
    );
  if (show("transcript"))
    row2.addComponents(
      new ButtonBuilder().setCustomId("ticket_transcript").setLabel("Transcript").setStyle(ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_note").setLabel("Nota interna").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_notes_view").setLabel("Ver notas").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_info").setLabel("Info").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("fechar_ticket").setLabel("Encerrar").setStyle(ButtonStyle.Danger)
  );

  const components = [row1, row2, row3].filter(r => r.components.length > 0);
  return { embeds: [embed], components };
}

function buildOpenSuccessEmbed(guildId, channelId, queuePos) {
  const cfg = loadConfig();
  const embed = new EmbedBuilder()
    .setColor(getAccent(cfg))
    .setTitle("Ticket aberto")
    .setDescription(
      [
        "Seu canal de atendimento foi criado.",
        queuePos ? `Você está na posição **#${queuePos}** da fila.` : null,
        "Clique no botão para ir até lá."
      ]
        .filter(Boolean)
        .join("\n")
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Ir para o ticket")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${guildId}/${channelId}`)
  );

  return { embeds: [embed], components: [row] };
}

function buildStatusSelect(cfg = loadConfig()) {
  const options = (cfg.statusOptions || []).slice(0, 25);
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(getAccent(cfg))
        .setTitle("Alterar status")
        .setDescription("Escolha o novo status no menu.")
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("ticket_status_select")
          .setPlaceholder("Status...")
          .addOptions(
            options.map(o => {
              const opt = new StringSelectMenuOptionBuilder()
                .setLabel(o.label)
                .setValue(o.value);
              // só emoji custom <:name:id>
              const m = String(o.emoji || "").match(/^<(a)?:([\w]+):(\d+)>$/);
              if (m) {
                try {
                  opt.setEmoji({ id: m[3], name: m[2], animated: Boolean(m[1]) });
                } catch {}
              }
              return opt;
            })
          )
      )
    ],
    ephemeral: true
  };
}

function buildPrioritySelect() {
  const cfg = loadConfig();
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(getAccent(cfg))
        .setTitle("Prioridade")
        .setDescription("Defina a urgência deste ticket.")
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("ticket_priority_select")
          .setPlaceholder("Prioridade...")
          .addOptions(
            Object.entries(PRIORITY).map(([value, p]) =>
              new StringSelectMenuOptionBuilder().setLabel(p.label).setValue(value)
            )
          )
      )
    ],
    ephemeral: true
  };
}

function buildRatingMessage(channelId) {
  const cfg = loadConfig();
  const embed = new EmbedBuilder()
    .setColor(getAccent(cfg))
    .setTitle("Avalie o atendimento")
    .setDescription(
      [
        "Sua opinião ajuda a melhorar o suporte.",
        "",
        "Clique de **1** (ruim) a **5** (excelente)."
      ].join("\n")
    )
    .setFooter({ text: `${cfg.brand || "Bot Ticket"} · avaliação` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    [1, 2, 3, 4, 5].map(n =>
      new ButtonBuilder()
        .setCustomId(`ticket_rate_${channelId}_${n}`)
        .setLabel(String(n))
        .setStyle(n >= 4 ? ButtonStyle.Success : n === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary)
    )
  );

  return { embeds: [embed], components: [row] };
}

function staffListEmbed(tickets) {
  const cfg = loadConfig();
  const lines =
    tickets
      .slice(0, 20)
      .map(
        (t, i) =>
          `**${i + 1}.** ${t.channel} · \`${t.typeLabel || "?"}\` · ${t.priority || "normal"} · ${
            t.claimedBy ? `<@${t.claimedBy}>` : "**livre**"
          }`
      )
      .join("\n") || "_Nenhum ticket aberto._";

  return new EmbedBuilder()
    .setColor(getAccent(cfg))
    .setTitle(`🛡️ Staff · Tickets abertos (${tickets.length})`)
    .setDescription(lines)
    .setTimestamp();
}

module.exports = {
  PRIORITY,
  priorityInfo,
  buildTicketEmbed,
  buildOpenSuccessEmbed,
  buildStatusSelect,
  buildPrioritySelect,
  buildRatingMessage,
  staffListEmbed
};
