const {
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags
} = require("discord.js");
const path = require("path");
const { loadConfig, getAccent } = require("./configStore");

const LOGO_PATH = path.join(__dirname, "../img/logo.png");

const STYLE_MAP = {
  1: ButtonStyle.Primary,
  2: ButtonStyle.Secondary,
  3: ButtonStyle.Success,
  4: ButtonStyle.Danger,
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger
};

function resolveStyle(v) {
  return STYLE_MAP[v] ?? ButtonStyle.Secondary;
}

/** Só aceita emoji customizado do Discord (modificado). Unicode padrão é ignorado. */
function parseEmoji(emoji) {
  if (!emoji || typeof emoji !== "string") return undefined;
  const m = emoji.trim().match(/^<(a)?:([\w]+):(\d+)>$/);
  if (!m) return undefined;
  return { id: m[3], name: m[2], animated: Boolean(m[1]) };
}

function applyEmoji(component, emoji) {
  const em = parseEmoji(emoji);
  if (em) {
    try {
      component.setEmoji(em);
    } catch {}
  }
  return component;
}

/** Painel público do canal */
function buildPublicPanel(guild) {
  const cfg = loadConfig(guild?.id);
  const accent = getAccent(cfg);
  const brand = cfg.brand || "Bot Ticket";
  const mode = (cfg.panelMode || "both").toLowerCase();
  const types = cfg.ticketTypes || [];

  const container = new ContainerBuilder().setAccentColor(accent);

  // Banner: URL custom ou arquivo local
  const bannerMedia = cfg.bannerUrl && String(cfg.bannerUrl).startsWith("http")
    ? cfg.bannerUrl
    : "attachment://logo.png";

  container.addMediaGalleryComponents(g =>
    g.addItems(item => item.setURL(bannerMedia))
  );

  // Ícone opcional via section thumbnail
  const title = cfg.panelTitle || brand;
  const body = [
    cfg.panelDescription || "Abra um ticket para falar com a equipe.",
    "",
    mode === "select"
      ? "**Use o menu** abaixo para escolher o tipo de atendimento."
      : mode === "buttons"
        ? "**Use os botões** abaixo para abrir seu ticket."
        : "**Menu** ou **botões** — escolha o tipo de atendimento.",
    "",
    `-# Máximo de **${cfg.maxTicketsPerUser || 2}** tickets abertos por pessoa.`
  ].join("\n");

  if (cfg.iconUrl && String(cfg.iconUrl).startsWith("http")) {
    container.addSectionComponents(section =>
      section
        .addTextDisplayComponents(
          t => t.setContent(`# ${title}`),
          t => t.setContent(body)
        )
        .setThumbnailAccessory(th => th.setURL(cfg.iconUrl))
    );
  } else {
    container.addTextDisplayComponents(
      t => t.setContent(`# ${title}`),
      t => t.setContent(body)
    );
  }

  container.addSeparatorComponents(s => s.setSpacing(2).setDivider(true));

  // FAQ
  const faq = cfg.faq || [];
  if (faq.length) {
    const faqSelect = new StringSelectMenuBuilder()
      .setCustomId("ticket_faq_select")
      .setPlaceholder("FAQ — perguntas frequentes...")
      .addOptions(
        faq.slice(0, 25).map((f, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel((f.question || `Pergunta ${i + 1}`).slice(0, 100))
            .setDescription((f.answer || "").slice(0, 100))
            .setValue(String(i))
        )
      );
    container.addActionRowComponents(row => row.setComponents(faqSelect));
  }

  // SELECT tipos
  if ((mode === "select" || mode === "both") && types.length) {
    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_open_select")
      .setPlaceholder("Selecionar tipo de ticket...")
      .addOptions(
        types.slice(0, 25).map(t => {
          const opt = new StringSelectMenuOptionBuilder()
            .setLabel(t.label)
            .setDescription((t.description || t.label).slice(0, 100))
            .setValue(t.id);
          applyEmoji(opt, t.emoji);
          return opt;
        })
      );
    container.addActionRowComponents(row => row.setComponents(select));
  }

  // BOTÕES (até 5 por row, máx 5 rows no container — usamos 2 rows = 10)
  if ((mode === "buttons" || mode === "both") && types.length) {
    const chunks = [];
    for (let i = 0; i < Math.min(types.length, 10); i += 5) {
      chunks.push(types.slice(i, i + 5));
    }
    for (const chunk of chunks) {
      container.addActionRowComponents(row =>
        row.setComponents(
          chunk.map(t => {
            const btn = new ButtonBuilder()
              .setCustomId(`ticket_btn_${t.id}`)
              .setLabel(t.label)
              .setStyle(resolveStyle(t.buttonStyle ?? 2));
            applyEmoji(btn, t.emoji);
            return btn;
          })
        )
      );
    }
  }

  if (cfg.panelFooter) {
    container.addTextDisplayComponents(t => t.setContent(`-# ${cfg.panelFooter}`));
  }

  const files = [];
  if (!cfg.bannerUrl || !String(cfg.bannerUrl).startsWith("http")) {
    files.push({ attachment: LOGO_PATH, name: "logo.png" });
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    files
  };
}

/** Painel interno do canal do ticket */
function buildTicketChannelPanel({ user, typeLabel, status, includePix, claimedBy, mentionLine }) {
  const cfg = loadConfig();
  const accent = getAccent(cfg);
  const brand = cfg.brand || "Bot Ticket";
  const statusText = status || "Aguardando";
  const claimText = claimedBy ? `\n**Atendente** · <@${claimedBy}>` : "";
  const bannerMedia =
    cfg.bannerUrl && String(cfg.bannerUrl).startsWith("http")
      ? cfg.bannerUrl
      : "attachment://logo.png";

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addMediaGalleryComponents(g =>
      g.addItems(item => item.setURL(bannerMedia))
    )
    .addTextDisplayComponents(
      t => t.setContent(`# ${brand} · Ticket`),
      t =>
        t.setContent(
          [
            mentionLine || "",
            `Olá **${user.username}**`,
            `**Tipo** · \`${typeLabel || "Geral"}\``,
            `**Status** · \`${statusText}\`${claimText}`,
            "",
            "Descreva o assunto com clareza e aguarde a equipe.",
            includePix
              ? "Se for compra, use **Pix** quando estiver pronto."
              : "A staff vai te atender em breve.",
            "",
            "-# Canal privado entre você e a equipe."
          ]
            .filter(Boolean)
            .join("\n")
        )
    )
    .addSeparatorComponents(s => s.setSpacing(2).setDivider(true));

  const row1 = [
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Assumir")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ticket_status")
      .setLabel("Status")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("notificar")
      .setLabel("Notificar")
      .setStyle(ButtonStyle.Secondary)
  ];

  if (includePix) {
    row1.push(
      new ButtonBuilder()
        .setCustomId("qrcode")
        .setLabel("Pix")
        .setStyle(ButtonStyle.Success)
    );
  }

  container.addActionRowComponents(row => row.setComponents(...row1.slice(0, 5)));

  container.addActionRowComponents(row =>
    row.setComponents(
      new ButtonBuilder()
        .setCustomId("fechar_ticket")
        .setLabel("Encerrar")
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return container;
}

function buildStatusSelect() {
  const cfg = loadConfig();
  const accent = getAccent(cfg);
  const options = (cfg.statusOptions || []).slice(0, 25);

  const select = new StringSelectMenuBuilder()
    .setCustomId("ticket_status_select")
    .setPlaceholder("Selecionar status...")
    .addOptions(
      options.map(o => {
        const opt = new StringSelectMenuOptionBuilder()
          .setLabel(o.label)
          .setValue(o.value);
        if (o.emoji) opt.setEmoji(parseEmoji(o.emoji));
        return opt;
      })
    );

  return new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(
      t => t.setContent(`# Status do ticket`),
      t => t.setContent("Escolha o status no menu abaixo.")
    )
    .addSeparatorComponents(s => s.setSpacing(1).setDivider(true))
    .addActionRowComponents(row => row.setComponents(select));
}

function buildOpenSuccess(guildId, channelId) {
  const cfg = loadConfig();
  return new ContainerBuilder()
    .setAccentColor(getAccent(cfg))
    .addTextDisplayComponents(t =>
      t.setContent(`### Ticket aberto\n-# Seu atendimento foi criado com sucesso.`)
    )
    .addSeparatorComponents(s => s.setDivider(true))
    .addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder()
          .setLabel("Ir para o ticket")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guildId}/${channelId}`)
      )
    );
}

module.exports = {
  LOGO_PATH,
  buildPublicPanel,
  buildTicketChannelPanel,
  buildStatusSelect,
  buildOpenSuccess,
  parseEmoji,
  applyEmoji,
  resolveStyle
};
