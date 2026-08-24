const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType
} = require("discord.js");
const { loadConfig, saveConfig, getAccent } = require("./configStore");

const NAV = {
  HOME: "cfg_nav_home",
  APPEARANCE: "cfg_nav_appearance",
  TEXTS: "cfg_nav_texts",
  CHANNELS: "cfg_nav_channels",
  TYPES: "cfg_nav_types",
  STATUS: "cfg_nav_status",
  SYSTEM: "cfg_nav_system"
};

function color(cfg) {
  return getAccent(cfg);
}

function baseEmbed(cfg, title, description) {
  const e = new EmbedBuilder()
    .setColor(color(cfg))
    .setTitle(title)
    .setDescription(description || null)
    .setFooter({ text: `${cfg.brand || "Bot Ticket"} · Config · navegue pelos botões` })
    .setTimestamp();

  if (cfg.iconUrl) e.setThumbnail(cfg.iconUrl);
  if (cfg.bannerUrl) e.setImage(cfg.bannerUrl);
  return e;
}

/** Linha de navegação principal (máx 5 botões) */
function navMain(active) {
  const btn = (id, label, key) =>
    new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(active === key ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(active === key);

  return new ActionRowBuilder().addComponents(
    btn(NAV.HOME, "Início", "home"),
    btn(NAV.APPEARANCE, "Visual", "appearance"),
    btn(NAV.TEXTS, "Textos", "texts"),
    btn(NAV.CHANNELS, "Canais", "channels"),
    btn(NAV.TYPES, "Tipos", "types")
  );
}

function navSecondary(active) {
  const btn = (id, label, key) =>
    new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(active === key ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(active === key);

  return new ActionRowBuilder().addComponents(
    btn(NAV.STATUS, "Status", "status"),
    btn(NAV.SYSTEM, "Sistema", "system"),
    new ButtonBuilder()
      .setCustomId("cfg_nav_home_btn")
      .setLabel("⌂ Home")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("cfg_close")
      .setLabel("Fechar")
      .setStyle(ButtonStyle.Danger)
  );
}

function payload(embed, ...rows) {
  return {
    embeds: [embed],
    components: rows.filter(Boolean),
    ephemeral: true
  };
}

// ─── PÁGINAS ─────────────────────────────────────────────────────────────────

function homePanel() {
  const cfg = loadConfig();
  const types = (cfg.ticketTypes || []).map(t => `• \`${t.id}\` **${t.label}**`).join("\n") || "_nenhum_";
  const statuses = (cfg.statusOptions || []).map(s => `• ${s.emoji || ""} ${s.label}`).join("\n") || "_nenhum_";

  const embed = baseEmbed(
    cfg,
    `⚙️ ${cfg.brand || "Bot Ticket"} · Configuração`,
    [
      "Painel completo de configuração.",
      "Use a **navegação** para editar cada área.",
      "",
      "### Geral",
      `**Marca** · \`${cfg.brand}\` · **Modo** · \`${cfg.panelMode}\` · **Max** · \`${cfg.maxTicketsPerUser}\``,
      `**Staff** · ${cfg.staffRole ? `<@&${cfg.staffRole}>` : "`—`"}`,
      `**Categoria** · ${cfg.ticketCategory ? `\`${cfg.ticketCategory}\`` : "`—`"}`,
      `**Logs** · ${cfg.logsChannel ? `<#${cfg.logsChannel}>` : "`—`"}`,
      "",
      "### Tipos",
      types,
      "",
      "### Status",
      statuses.slice(0, 500)
    ].join("\n")
  );

  return payload(embed, navMain("home"), navSecondary("home"));
}

function appearancePanel() {
  const cfg = loadConfig();
  const embed = baseEmbed(
    cfg,
    "🎨 Visual",
    [
      "Banner, ícone, cor e nome da marca.",
      "",
      `**Marca** · \`${cfg.brand}\``,
      `**Cor** · \`#${String(cfg.accentColor).replace("#", "")}\``,
      `**Banner** · ${cfg.bannerUrl ? `[link](${cfg.bannerUrl})` : "`img/logo.png (local)`"}`,
      `**Ícone** · ${cfg.iconUrl ? `[link](${cfg.iconUrl})` : "`—`"}`,
      "",
      "-# Banner aparece no painel e nas embeds de config."
    ].join("\n")
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("cfg_edit_brand").setLabel("Marca").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("cfg_edit_color").setLabel("Cor").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cfg_edit_banner").setLabel("Banner").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("cfg_edit_icon").setLabel("Ícone").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("cfg_clear_media").setLabel("Limpar mídia").setStyle(ButtonStyle.Danger)
  );

  return payload(embed, navMain("appearance"), navSecondary("appearance"), actions);
}

function textsPanel() {
  const cfg = loadConfig();
  const desc = cfg.panelDescription || "—";
  const embed = baseEmbed(
    cfg,
    "📝 Textos do painel",
    [
      `**Título**\n\`\`\`${cfg.panelTitle || "—"}\`\`\``,
      `**Rodapé**\n\`\`\`${cfg.panelFooter || "—"}\`\`\``,
      `**Descrição**\n\`\`\`${desc.slice(0, 900)}\`\`\``
    ].join("\n")
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("cfg_edit_title").setLabel("Título").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("cfg_edit_description").setLabel("Descrição").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cfg_edit_footer").setLabel("Rodapé").setStyle(ButtonStyle.Secondary)
  );

  return payload(embed, navMain("texts"), navSecondary("texts"), actions);
}

function channelsPanel() {
  const cfg = loadConfig();
  const embed = baseEmbed(
    cfg,
    "📁 Canais & cargos",
    [
      "Selecione nos menus (um por vez).",
      "",
      `**Staff** · ${cfg.staffRole ? `<@&${cfg.staffRole}>` : "`—`"}`,
      `**Categoria** · ${cfg.ticketCategory ? `\`${cfg.ticketCategory}\`` : "`—`"}`,
      `**Logs** · ${cfg.logsChannel ? `<#${cfg.logsChannel}>` : "`—`"}`,
      `**Boas-vindas** · ${cfg.welcomeChannel ? `<#${cfg.welcomeChannel}>` : "`—`"}`
    ].join("\n")
  );

  // max 5 rows: navMain + 3 selects + button row for welcome/clear
  const roleSelect = new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId("cfg_select_staff")
      .setPlaceholder("Cargo da staff...")
  );

  const catSelect = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId("cfg_select_category")
      .setPlaceholder("Categoria dos tickets...")
      .addChannelTypes(ChannelType.GuildCategory)
  );

  const logsSelect = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId("cfg_select_logs")
      .setPlaceholder("Canal de logs...")
      .addChannelTypes(ChannelType.GuildText)
  );

  return payload(embed, navMain("channels"), roleSelect, catSelect, logsSelect);
}

function channelsPanelExtra() {
  // second page for welcome - merged into channels with a button
}

function typesPanel() {
  const cfg = loadConfig();
  const list = (cfg.ticketTypes || [])
    .map(
      (t, i) =>
        `**${i + 1}.** \`${t.id}\` · ${t.emoji || ""} **${t.label}**\n-# ${(t.description || "").slice(0, 80)} · pix: ${t.includePix ? "sim" : "não"}`
    )
    .join("\n\n") || "_Nenhum tipo. Clique em Adicionar._";

  const embed = baseEmbed(
    cfg,
    "Tipos de ticket",
    [
      "Tipos do **select** e dos **botões** do painel.",
      "Selecione um tipo para editar, ou adicione/remova.",
      "",
      list
    ].join("\n")
  );

  const rows = [navMain("types"), navSecondary("types")];

  if ((cfg.ticketTypes || []).length) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("cfg_type_pick")
          .setPlaceholder("Selecionar tipo para editar...")
          .addOptions(
            cfg.ticketTypes.slice(0, 25).map(t => {
              const opt = new StringSelectMenuOptionBuilder()
                .setLabel(t.label.slice(0, 100))
                .setDescription(`id: ${t.id}`.slice(0, 100))
                .setValue(t.id);
              // só emoji custom <:name:id>
              const m = String(t.emoji || "").match(/^<(a)?:([\w]+):(\d+)>$/);
              if (m) {
                try {
                  opt.setEmoji({ id: m[3], name: m[2], animated: Boolean(m[1]) });
                } catch {}
              }
              return opt;
            })
          )
      )
    );
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cfg_type_add").setLabel("Adicionar tipo").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cfg_type_remove_menu").setLabel("Remover tipo").setStyle(ButtonStyle.Danger)
    )
  );

  return payload(embed, ...rows.slice(0, 5));
}

function typeEditPanel(typeId) {
  const cfg = loadConfig();
  const t = (cfg.ticketTypes || []).find(x => x.id === typeId);
  if (!t) return typesPanel();

  const embed = baseEmbed(
    cfg,
    `✏️ Tipo · ${t.label}`,
    [
      `**ID** · \`${t.id}\` _(não muda)_`,
      `**Label** · \`${t.label}\``,
      `**Descrição** · \`${t.description || "—"}\``,
      `**Emoji** · ${t.emoji || "`—`"}`,
      `**Categoria** · ${t.categoryId ? `\`${t.categoryId}\`` : "`padrão do bot`"}`,
      `**Pix** · \`${t.includePix ? "sim" : "não"}\``,
      `**Estilo botão** · \`${t.buttonStyle ?? 2}\` (1 azul · 2 cinza · 3 verde · 4 vermelho)`,
      "",
      "Edite os campos pelos botões."
    ].join("\n")
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cfg_type_edit_${typeId}`).setLabel("Editar campos").setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`cfg_type_pix_${typeId}`)
      .setLabel(t.includePix ? "Desativar Pix" : "Ativar Pix")
      .setStyle(t.includePix ? ButtonStyle.Secondary : ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`cfg_type_style_${typeId}`).setLabel("Ciclar estilo").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`cfg_type_cat_${typeId}`).setLabel("Categoria ID").setStyle(ButtonStyle.Secondary)
  );

  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(NAV.TYPES).setLabel("← Voltar tipos").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`cfg_type_del_${typeId}`).setLabel("Apagar tipo").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("cfg_close").setLabel("Fechar").setStyle(ButtonStyle.Secondary)
  );

  return payload(embed, navMain("types"), actions, back);
}

function statusPanel() {
  const cfg = loadConfig();
  const list = (cfg.statusOptions || [])
    .map((s, i) => `**${i + 1}.** ${s.emoji || "•"} **${s.label}** → \`${s.value}\``)
    .join("\n") || "_Nenhum status._";

  const embed = baseEmbed(
    cfg,
    "📋 Status de ticket",
    [
      "Opções do select de status dentro do ticket.",
      "",
      list
    ].join("\n")
  );

  const rows = [navMain("status"), navSecondary("status")];

  if ((cfg.statusOptions || []).length) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("cfg_status_pick")
          .setPlaceholder("Selecionar status para editar...")
          .addOptions(
            cfg.statusOptions.slice(0, 25).map((s, i) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(s.label.slice(0, 100))
                .setDescription(`value: ${s.value}`.slice(0, 100))
                .setValue(String(i))
            )
          )
      )
    );
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cfg_status_add").setLabel("Adicionar status").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cfg_status_remove_menu").setLabel("Remover status").setStyle(ButtonStyle.Danger)
    )
  );

  return payload(embed, ...rows.slice(0, 5));
}

function statusEditPanel(index) {
  const cfg = loadConfig();
  const s = (cfg.statusOptions || [])[index];
  if (!s) return statusPanel();

  const embed = baseEmbed(
    cfg,
    `✏️ Status · ${s.label}`,
    [
      `**Label** · \`${s.label}\``,
      `**Value** · \`${s.value}\``,
      `**Emoji** · ${s.emoji || "`—`"}`,
      "",
      "Edite ou remova este status."
    ].join("\n")
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cfg_status_edit_${index}`).setLabel("Editar campos").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`cfg_status_del_${index}`).setLabel("Remover").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(NAV.STATUS).setLabel("← Voltar").setStyle(ButtonStyle.Success)
  );

  return payload(embed, navMain("status"), actions, navSecondary("status"));
}

function systemPanel() {
  const cfg = loadConfig();
  const embed = baseEmbed(
    cfg,
    "🛠️ Sistema",
    [
      `**Modo do painel** · \`${cfg.panelMode}\` _(buttons / select / both)_`,
      `**Max tickets/user** · \`${cfg.maxTicketsPerUser}\``,
      `**Delay ao fechar** · \`${cfg.closeDelaySeconds || 5}s\``,
      `**Pix configurado** · \`${cfg.pixPayload || cfg.pixKey ? "sim" : "não"}\``,
      `**URL atendimento** · ${cfg.atendimentoUrl || "`—`"}`,
      `**URL info** · ${cfg.infoUrl || "`—`"}`,
      "",
      "Altere modo, limites e Pix pelos botões."
    ].join("\n")
  );

  const modeRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("cfg_system_mode")
      .setPlaceholder("Modo do painel...")
      .addOptions(
        { label: "Só botões", value: "buttons", description: "Apenas botões no painel" },
        { label: "Só select", value: "select", description: "Apenas menu dropdown" },
        { label: "Botões + select", value: "both", description: "Os dois juntos" }
      )
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("cfg_edit_max").setLabel("Max tickets").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cfg_edit_delay").setLabel("Delay fechar").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("cfg_edit_pix").setLabel("Pix payload").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("cfg_edit_links").setLabel("Links welcome").setStyle(ButtonStyle.Secondary)
  );

  return payload(embed, navMain("system"), navSecondary("system"), modeRow, actions);
}

function getPage(page, extra) {
  switch (page) {
    case "home":
      return homePanel();
    case "appearance":
      return appearancePanel();
    case "texts":
      return textsPanel();
    case "channels":
      return channelsPanel();
    case "types":
      return typesPanel();
    case "type_edit":
      return typeEditPanel(extra);
    case "status":
      return statusPanel();
    case "status_edit":
      return statusEditPanel(Number(extra));
    case "system":
      return systemPanel();
    default:
      return homePanel();
  }
}

// ─── MODAIS ──────────────────────────────────────────────────────────────────

function modalBrand() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_brand")
    .setTitle("Marca do bot")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Nome da marca")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(cfg.brand || "Bot Ticket")
          .setMaxLength(32)
      )
    );
}

function modalColor() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_color")
    .setTitle("Cor accent")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Hex (ex: 0b0b0b ou #5865F2)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(String(cfg.accentColor || "0b0b0b").replace("#", ""))
          .setMaxLength(7)
      )
    );
}

function modalBanner() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_banner")
    .setTitle("Banner (URL)")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("URL da imagem (https)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(cfg.bannerUrl || "https://")
          .setMaxLength(300)
      )
    );
}

function modalIcon() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_icon")
    .setTitle("Ícone (URL)")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("URL do ícone/thumbnail")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(cfg.iconUrl || "https://")
          .setMaxLength(300)
      )
    );
}

function modalTitle() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_title")
    .setTitle("Título do painel")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Título")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(cfg.panelTitle || "")
          .setMaxLength(100)
      )
    );
}

function modalDescription() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_description")
    .setTitle("Descrição do painel")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Descrição completa")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setValue((cfg.panelDescription || "").slice(0, 1000))
          .setMaxLength(1000)
      )
    );
}

function modalFooter() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_footer")
    .setTitle("Rodapé do painel")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Rodapé")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(cfg.panelFooter || "")
          .setMaxLength(200)
      )
    );
}

function modalTypeAdd() {
  return new ModalBuilder()
    .setCustomId("cfg_modal_type_add")
    .setTitle("Novo tipo de ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID (sem espaços, ex: vip)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(24)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("label")
          .setLabel("Nome exibido")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Descrição (select)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("emoji")
          .setLabel("Emoji custom (ex: <:nome:id>)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(80)
          .setPlaceholder("Somente emoji do servidor")
      )
    );
}

function modalTypeEdit(typeId) {
  const cfg = loadConfig();
  const t = (cfg.ticketTypes || []).find(x => x.id === typeId);
  if (!t) return null;
  return new ModalBuilder()
    .setCustomId(`cfg_modal_type_edit_${typeId}`)
    .setTitle(`Editar · ${t.label}`.slice(0, 45))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("label")
          .setLabel("Nome exibido")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(t.label)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Descrição")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(t.description || "")
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("emoji")
          .setLabel("Emoji")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(t.emoji || "")
          .setMaxLength(64)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("categoryId")
          .setLabel("ID categoria (vazio = padrão)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(t.categoryId || "")
          .setMaxLength(25)
      )
    );
}

function modalTypeCat(typeId) {
  const cfg = loadConfig();
  const t = (cfg.ticketTypes || []).find(x => x.id === typeId);
  return new ModalBuilder()
    .setCustomId(`cfg_modal_type_cat_${typeId}`)
    .setTitle("Categoria do tipo")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("categoryId")
          .setLabel("ID da categoria Discord")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(t?.categoryId || "")
          .setMaxLength(25)
      )
    );
}

function modalStatusAdd() {
  return new ModalBuilder()
    .setCustomId("cfg_modal_status_add")
    .setTitle("Novo status")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("label")
          .setLabel("Label")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Value (salvo no ticket)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("emoji")
          .setLabel("Emoji")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(64)
      )
    );
}

function modalStatusEdit(index) {
  const cfg = loadConfig();
  const s = (cfg.statusOptions || [])[index];
  if (!s) return null;
  return new ModalBuilder()
    .setCustomId(`cfg_modal_status_edit_${index}`)
    .setTitle(`Editar status`.slice(0, 45))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("label")
          .setLabel("Label")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(s.label)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Value")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(s.value)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("emoji")
          .setLabel("Emoji")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(s.emoji || "")
          .setMaxLength(64)
      )
    );
}

function modalMax() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_max")
    .setTitle("Máximo de tickets")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Quantidade (1-5)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(String(cfg.maxTicketsPerUser || 2))
          .setMaxLength(1)
      )
    );
}

function modalDelay() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_delay")
    .setTitle("Delay ao fechar (segundos)")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Segundos (1-60)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(String(cfg.closeDelaySeconds || 5))
          .setMaxLength(2)
      )
    );
}

function modalPix() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_pix")
    .setTitle("Payload Pix")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Copia e cola / chave")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setValue((cfg.pixPayload || cfg.pixKey || "").slice(0, 1000))
          .setMaxLength(1000)
      )
    );
}

function modalLinks() {
  const cfg = loadConfig();
  return new ModalBuilder()
    .setCustomId("cfg_modal_links")
    .setTitle("Links de boas-vindas")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("atendimentoUrl")
          .setLabel("URL botão Atendimento")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(cfg.atendimentoUrl || "")
          .setMaxLength(300)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("infoUrl")
          .setLabel("URL botão Informações")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(cfg.infoUrl || "")
          .setMaxLength(300)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("welcomeChannel")
          .setLabel("ID canal boas-vindas")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(cfg.welcomeChannel || "")
          .setMaxLength(25)
      )
    );
}

function removeTypeSelect() {
  const cfg = loadConfig();
  const embed = baseEmbed(cfg, "🗑️ Remover tipo", "Selecione o tipo que deseja remover.");
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("cfg_type_remove_pick")
      .setPlaceholder("Remover tipo...")
      .addOptions(
        (cfg.ticketTypes || []).slice(0, 25).map(t =>
          new StringSelectMenuOptionBuilder()
            .setLabel(t.label)
            .setDescription(t.id)
            .setValue(t.id)
        )
      )
  );
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(NAV.TYPES).setLabel("← Cancelar").setStyle(ButtonStyle.Secondary)
  );
  return payload(embed, row, back);
}

function removeStatusSelect() {
  const cfg = loadConfig();
  const embed = baseEmbed(cfg, "🗑️ Remover status", "Selecione o status a remover.");
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("cfg_status_remove_pick")
      .setPlaceholder("Remover status...")
      .addOptions(
        (cfg.statusOptions || []).slice(0, 25).map((s, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(s.label)
            .setDescription(s.value)
            .setValue(String(i))
        )
      )
  );
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(NAV.STATUS).setLabel("← Cancelar").setStyle(ButtonStyle.Secondary)
  );
  return payload(embed, row, back);
}

module.exports = {
  NAV,
  homePanel,
  getPage,
  appearancePanel,
  textsPanel,
  channelsPanel,
  typesPanel,
  typeEditPanel,
  statusPanel,
  statusEditPanel,
  systemPanel,
  removeTypeSelect,
  removeStatusSelect,
  modalBrand,
  modalColor,
  modalBanner,
  modalIcon,
  modalTitle,
  modalDescription,
  modalFooter,
  modalTypeAdd,
  modalTypeEdit,
  modalTypeCat,
  modalStatusAdd,
  modalStatusEdit,
  modalMax,
  modalDelay,
  modalPix,
  modalLinks
};
