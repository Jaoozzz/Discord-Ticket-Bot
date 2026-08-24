const { loadConfig, saveConfig } = require("./configStore");
const ui = require("./configUI");
const { isOwner } = require("./permissions");

async function replyPanel(interaction, panel) {
  const data = { ...panel, ephemeral: true };
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(data);
  }
  return interaction.reply(data);
}

async function updatePanel(interaction, panel) {
  return interaction.update({
    embeds: panel.embeds,
    components: panel.components
  });
}

function deny(interaction) {
  return interaction.reply({ content: "Apenas o dono.", ephemeral: true }).catch(() => {});
}

async function handleConfigButton(interaction) {
  if (!isOwner(interaction.user.id)) {
    if (interaction.customId.startsWith("cfg_")) return deny(interaction);
    return false;
  }
  if (!interaction.customId.startsWith("cfg_")) return false;

  const id = interaction.customId;

  // Navegação
  if (id === ui.NAV.HOME || id === "cfg_nav_home" || id === "cfg_nav_home_btn") {
    return updatePanel(interaction, ui.homePanel());
  }
  if (id === ui.NAV.APPEARANCE) return updatePanel(interaction, ui.appearancePanel());
  if (id === ui.NAV.TEXTS) return updatePanel(interaction, ui.textsPanel());
  if (id === ui.NAV.CHANNELS) return updatePanel(interaction, ui.channelsPanel());
  if (id === ui.NAV.TYPES) return updatePanel(interaction, ui.typesPanel());
  if (id === ui.NAV.STATUS) return updatePanel(interaction, ui.statusPanel());
  if (id === ui.NAV.SYSTEM) return updatePanel(interaction, ui.systemPanel());

  if (id === "cfg_close") {
    return interaction.update({
      content: "Config fechada.",
      embeds: [],
      components: []
    });
  }

  // Visual
  if (id === "cfg_edit_brand") return interaction.showModal(ui.modalBrand());
  if (id === "cfg_edit_color") return interaction.showModal(ui.modalColor());
  if (id === "cfg_edit_banner") return interaction.showModal(ui.modalBanner());
  if (id === "cfg_edit_icon") return interaction.showModal(ui.modalIcon());
  if (id === "cfg_clear_media") {
    const cfg = loadConfig();
    cfg.bannerUrl = "";
    cfg.iconUrl = "";
    saveConfig(cfg);
    return updatePanel(interaction, ui.appearancePanel());
  }

  // Textos
  if (id === "cfg_edit_title") return interaction.showModal(ui.modalTitle());
  if (id === "cfg_edit_description") return interaction.showModal(ui.modalDescription());
  if (id === "cfg_edit_footer") return interaction.showModal(ui.modalFooter());

  // Tipos
  if (id === "cfg_type_add") return interaction.showModal(ui.modalTypeAdd());
  if (id === "cfg_type_remove_menu") return updatePanel(interaction, ui.removeTypeSelect());

  if (id.startsWith("cfg_type_edit_")) {
    const typeId = id.replace("cfg_type_edit_", "");
    const m = ui.modalTypeEdit(typeId);
    if (!m) return updatePanel(interaction, ui.typesPanel());
    return interaction.showModal(m);
  }
  if (id.startsWith("cfg_type_pix_")) {
    const typeId = id.replace("cfg_type_pix_", "");
    const cfg = loadConfig();
    const t = cfg.ticketTypes.find(x => x.id === typeId);
    if (t) {
      t.includePix = !t.includePix;
      saveConfig(cfg);
    }
    return updatePanel(interaction, ui.typeEditPanel(typeId));
  }
  if (id.startsWith("cfg_type_style_")) {
    const typeId = id.replace("cfg_type_style_", "");
    const cfg = loadConfig();
    const t = cfg.ticketTypes.find(x => x.id === typeId);
    if (t) {
      const styles = [1, 2, 3, 4];
      const cur = styles.indexOf(Number(t.buttonStyle) || 2);
      t.buttonStyle = styles[(cur + 1) % styles.length];
      saveConfig(cfg);
    }
    return updatePanel(interaction, ui.typeEditPanel(typeId));
  }
  if (id.startsWith("cfg_type_cat_")) {
    const typeId = id.replace("cfg_type_cat_", "");
    return interaction.showModal(ui.modalTypeCat(typeId));
  }
  if (id.startsWith("cfg_type_del_")) {
    const typeId = id.replace("cfg_type_del_", "");
    const cfg = loadConfig();
    cfg.ticketTypes = (cfg.ticketTypes || []).filter(t => t.id !== typeId);
    saveConfig(cfg);
    return updatePanel(interaction, ui.typesPanel());
  }

  // Status
  if (id === "cfg_status_add") return interaction.showModal(ui.modalStatusAdd());
  if (id === "cfg_status_remove_menu") return updatePanel(interaction, ui.removeStatusSelect());
  if (id.startsWith("cfg_status_edit_")) {
    const index = Number(id.replace("cfg_status_edit_", ""));
    const m = ui.modalStatusEdit(index);
    if (!m) return updatePanel(interaction, ui.statusPanel());
    return interaction.showModal(m);
  }
  if (id.startsWith("cfg_status_del_")) {
    const index = Number(id.replace("cfg_status_del_", ""));
    const cfg = loadConfig();
    cfg.statusOptions.splice(index, 1);
    saveConfig(cfg);
    return updatePanel(interaction, ui.statusPanel());
  }

  // Sistema
  if (id === "cfg_edit_max") return interaction.showModal(ui.modalMax());
  if (id === "cfg_edit_delay") return interaction.showModal(ui.modalDelay());
  if (id === "cfg_edit_pix") return interaction.showModal(ui.modalPix());
  if (id === "cfg_edit_links") return interaction.showModal(ui.modalLinks());

  return false;
}

async function handleConfigSelect(interaction) {
  if (!isOwner(interaction.user.id)) {
    if (interaction.customId.startsWith("cfg_")) return deny(interaction);
    return false;
  }
  if (!interaction.customId.startsWith("cfg_")) return false;

  const id = interaction.customId;
  const cfg = loadConfig();

  if (id === "cfg_select_staff") {
    cfg.staffRole = interaction.values[0];
    saveConfig(cfg);
    return updatePanel(interaction, ui.channelsPanel());
  }
  if (id === "cfg_select_category") {
    cfg.ticketCategory = interaction.values[0];
    saveConfig(cfg);
    return updatePanel(interaction, ui.channelsPanel());
  }
  if (id === "cfg_select_logs") {
    cfg.logsChannel = interaction.values[0];
    saveConfig(cfg);
    return updatePanel(interaction, ui.channelsPanel());
  }
  if (id === "cfg_select_welcome") {
    cfg.welcomeChannel = interaction.values[0];
    saveConfig(cfg);
    return updatePanel(interaction, ui.channelsPanel());
  }

  if (id === "cfg_type_pick") {
    return updatePanel(interaction, ui.typeEditPanel(interaction.values[0]));
  }
  if (id === "cfg_type_remove_pick") {
    const typeId = interaction.values[0];
    cfg.ticketTypes = (cfg.ticketTypes || []).filter(t => t.id !== typeId);
    saveConfig(cfg);
    return updatePanel(interaction, ui.typesPanel());
  }

  if (id === "cfg_status_pick") {
    return updatePanel(interaction, ui.statusEditPanel(Number(interaction.values[0])));
  }
  if (id === "cfg_status_remove_pick") {
    const index = Number(interaction.values[0]);
    cfg.statusOptions.splice(index, 1);
    saveConfig(cfg);
    return updatePanel(interaction, ui.statusPanel());
  }

  if (id === "cfg_system_mode") {
    cfg.panelMode = interaction.values[0];
    saveConfig(cfg);
    return updatePanel(interaction, ui.systemPanel());
  }

  return false;
}

async function handleConfigModal(interaction) {
  if (!isOwner(interaction.user.id)) {
    if (interaction.customId.startsWith("cfg_modal_")) {
      return interaction.reply({ content: "Apenas o dono.", ephemeral: true });
    }
    return false;
  }
  if (!interaction.customId.startsWith("cfg_modal_")) return false;

  const id = interaction.customId;
  const cfg = loadConfig();
  const val = () => interaction.fields.getTextInputValue("value")?.trim();

  const after = async page => {
    await interaction.deferUpdate();
    await interaction.editReply(ui.getPage(page.page, page.extra));
  };

  if (id === "cfg_modal_brand") {
    cfg.brand = val();
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.appearancePanel());
  }
  if (id === "cfg_modal_color") {
    cfg.accentColor = val().replace("#", "");
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.appearancePanel());
  }
  if (id === "cfg_modal_banner") {
    const v = val();
    if (!v.startsWith("http")) {
      return interaction.reply({ content: "URL inválida (precisa https).", ephemeral: true });
    }
    cfg.bannerUrl = v;
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.appearancePanel());
  }
  if (id === "cfg_modal_icon") {
    const v = val();
    if (!v.startsWith("http")) {
      return interaction.reply({ content: "URL inválida.", ephemeral: true });
    }
    cfg.iconUrl = v;
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.appearancePanel());
  }
  if (id === "cfg_modal_title") {
    cfg.panelTitle = val();
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.textsPanel());
  }
  if (id === "cfg_modal_description") {
    cfg.panelDescription = val();
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.textsPanel());
  }
  if (id === "cfg_modal_footer") {
    cfg.panelFooter = val();
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.textsPanel());
  }

  if (id === "cfg_modal_type_add") {
    const tid = interaction.fields.getTextInputValue("id").trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "");
    const label = interaction.fields.getTextInputValue("label").trim();
    const description = interaction.fields.getTextInputValue("description").trim();
    const emoji = interaction.fields.getTextInputValue("emoji")?.trim() || "";
    if (!tid || !label) {
      return interaction.reply({ content: "ID e label obrigatórios.", ephemeral: true });
    }
    if ((cfg.ticketTypes || []).some(t => t.id === tid)) {
      return interaction.reply({ content: "Já existe tipo com esse ID.", ephemeral: true });
    }
    cfg.ticketTypes = cfg.ticketTypes || [];
    cfg.ticketTypes.push({
      id: tid,
      label,
      description,
      emoji: /^<(a)?:[\w]+:\d+>$/.test(emoji) ? emoji : "",
      categoryId: "",
      includePix: false,
      buttonStyle: 2
    });
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.typesPanel());
  }

  if (id.startsWith("cfg_modal_type_edit_")) {
    const typeId = id.replace("cfg_modal_type_edit_", "");
    const t = cfg.ticketTypes.find(x => x.id === typeId);
    if (t) {
      t.label = interaction.fields.getTextInputValue("label").trim();
      t.description = interaction.fields.getTextInputValue("description").trim();
      // só grava se for emoji custom do Discord
      const em = interaction.fields.getTextInputValue("emoji")?.trim() || "";
      t.emoji = /^<(a)?:[\w]+:\d+>$/.test(em) ? em : "";
      t.categoryId = interaction.fields.getTextInputValue("categoryId")?.trim() || "";
      saveConfig(cfg);
    }
    await interaction.deferUpdate();
    return interaction.editReply(ui.typeEditPanel(typeId));
  }

  if (id.startsWith("cfg_modal_type_cat_")) {
    const typeId = id.replace("cfg_modal_type_cat_", "");
    const t = cfg.ticketTypes.find(x => x.id === typeId);
    if (t) {
      t.categoryId = interaction.fields.getTextInputValue("categoryId")?.trim() || "";
      saveConfig(cfg);
    }
    await interaction.deferUpdate();
    return interaction.editReply(ui.typeEditPanel(typeId));
  }

  if (id === "cfg_modal_status_add") {
    cfg.statusOptions = cfg.statusOptions || [];
    const stEmoji = interaction.fields.getTextInputValue("emoji")?.trim() || "";
    cfg.statusOptions.push({
      label: interaction.fields.getTextInputValue("label").trim(),
      value: interaction.fields.getTextInputValue("value").trim(),
      emoji: /^<(a)?:[\w]+:\d+>$/.test(stEmoji) ? stEmoji : ""
    });
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.statusPanel());
  }

  if (id.startsWith("cfg_modal_status_edit_")) {
    const index = Number(id.replace("cfg_modal_status_edit_", ""));
    if (cfg.statusOptions[index]) {
      const stEmoji = interaction.fields.getTextInputValue("emoji")?.trim() || "";
      cfg.statusOptions[index] = {
        label: interaction.fields.getTextInputValue("label").trim(),
        value: interaction.fields.getTextInputValue("value").trim(),
        emoji: /^<(a)?:[\w]+:\d+>$/.test(stEmoji) ? stEmoji : ""
      };
      saveConfig(cfg);
    }
    await interaction.deferUpdate();
    return interaction.editReply(ui.statusEditPanel(index));
  }

  if (id === "cfg_modal_max") {
    const n = Math.min(5, Math.max(1, parseInt(val(), 10) || 2));
    cfg.maxTicketsPerUser = n;
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.systemPanel());
  }
  if (id === "cfg_modal_delay") {
    const n = Math.min(60, Math.max(1, parseInt(val(), 10) || 5));
    cfg.closeDelaySeconds = n;
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.systemPanel());
  }
  if (id === "cfg_modal_pix") {
    cfg.pixPayload = val();
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.systemPanel());
  }
  if (id === "cfg_modal_links") {
    cfg.atendimentoUrl = interaction.fields.getTextInputValue("atendimentoUrl")?.trim() || "";
    cfg.infoUrl = interaction.fields.getTextInputValue("infoUrl")?.trim() || "";
    cfg.welcomeChannel = interaction.fields.getTextInputValue("welcomeChannel")?.trim() || "";
    saveConfig(cfg);
    await interaction.deferUpdate();
    return interaction.editReply(ui.systemPanel());
  }

  return false;
}

module.exports = {
  handleConfigButton,
  handleConfigSelect,
  handleConfigModal,
  replyPanel
};
