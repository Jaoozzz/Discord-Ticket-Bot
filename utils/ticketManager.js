const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { loadConfig, getTicketType, getAccent } = require("./configStore");
const {
  getUserTickets,
  addUserTicket,
  removeUserTicket,
  setOwner,
  getOwner,
  setPanelMsg,
  getPanelMsg,
  setStatus,
  getStatus,
  setTicketMeta,
  getTicketMeta,
  listOpenTickets,
  listOpenChannelIds
} = require("./db");
const {
  buildTicketEmbed,
  buildOpenSuccessEmbed,
  buildRatingMessage,
  priorityInfo
} = require("./ticketEmbed");
const { buildTranscript, buildTranscriptHtml } = require("./transcript");
const { isBlocked } = require("./blacklistTickets");
const { isWithinBusinessHours } = require("./businessHours");

function slug(name) {
  return (
    String(name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "")
      .slice(0, 20) || "user"
  );
}

function getQueuePosition(typeId, channelId, guildId) {
  const list = listOpenTickets(guildId)
    .filter(m => !typeId || m.typeId === typeId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const idx = list.findIndex(m => m.channelId === channelId);
  return idx >= 0 ? idx + 1 : list.length + 1;
}

async function openTicket(interaction, typeId, form = {}) {
  const guildId = interaction.guild.id;
  const cfg = loadConfig(guildId);
  const type = getTicketType(cfg, typeId) || {
    id: typeId || "geral",
    label: "Geral",
    includePix: false,
    categoryId: ""
  };

  const userId = interaction.user.id;

  const blocked = isBlocked(userId, guildId);
  if (blocked) {
    const msg = `Você está bloqueado de abrir tickets.\n**Motivo:** ${blocked.reason}`;
    if (interaction.deferred || interaction.replied) return interaction.editReply({ content: msg });
    return interaction.reply({ content: msg, ephemeral: true });
  }

  const hours = isWithinBusinessHours(cfg);
  if (!hours.ok) {
    if (interaction.deferred || interaction.replied) return interaction.editReply({ content: hours.message });
    return interaction.reply({ content: hours.message, ephemeral: true });
  }

  const open = getUserTickets(userId, guildId);
  const max = cfg.maxTicketsPerUser || 2;
  if (open.length >= max) {
    const msg = `Você já tem **${open.length}/${max}** tickets abertos.`;
    if (interaction.deferred || interaction.replied) return interaction.editReply({ content: msg });
    return interaction.reply({ content: msg, ephemeral: true });
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  const parent = type.categoryId || cfg.ticketCategory || undefined;

  const overwrites = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];
  if (cfg.staffRole) {
    overwrites.push({
      id: cfg.staffRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  const canal = await interaction.guild.channels.create({
    name: `${type.id}-${slug(interaction.user.username)}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: parent || undefined,
    topic: `${cfg.brand || "Ticket"} | ${type.label} | ${userId}`,
    permissionOverwrites: overwrites
  });

  const createdAt = Date.now();
  addUserTicket(userId, canal.id, guildId);
  setTicketMeta(canal.id, {
    guildId,
    ownerId: userId,
    typeId: type.id,
    typeLabel: type.label,
    includePix: !!type.includePix,
    claimedBy: null,
    priority: form.priority || "normal",
    status: "Aguardando",
    createdAt,
    lastActivity: createdAt,
    formSubject: form.subject || null,
    formDetails: form.details || null,
    warnedInactive: false,
    warnedSla: false,
    closed: false
  });

  const queuePos = getQueuePosition(type.id, canal.id, guildId);

  if (cfg.staffRole) {
    await canal.send({ content: `<@&${cfg.staffRole}> · <@${userId}>` }).catch(() => {});
  } else {
    await canal.send({ content: `<@${userId}>` }).catch(() => {});
  }

  if (form.subject || form.details) {
    const fe = new EmbedBuilder()
      .setColor(getAccent(cfg))
      .setTitle("📝 Formulário de abertura")
      .setTimestamp();
    if (form.subject) fe.addFields({ name: "Assunto", value: form.subject.slice(0, 1024) });
    if (form.details) fe.addFields({ name: "Detalhes", value: form.details.slice(0, 1024) });
    await canal.send({ embeds: [fe] }).catch(() => {});
  }

  const panel = buildTicketEmbed({
    user: interaction.user,
    typeLabel: type.label,
    status: "Aguardando",
    claimedBy: null,
    priority: form.priority || "normal",
    queuePos,
    createdAt,
    includePix: !!type.includePix,
    formSubject: form.subject,
    formDetails: form.details
  });

  const painelMsg = await canal.send(panel);
  setPanelMsg(canal.id, painelMsg.id);

  await logTicket(interaction.client, {
    guildId,
    title: "Ticket aberto",
    description: `**${interaction.user.tag}** abriu \`${type.label}\` → ${canal}\nFila: **#${queuePos}**${
      form.subject ? `\nAssunto: ${form.subject}` : ""
    }`,
    color: 0x57f287
  });

  await interaction.editReply(
    buildOpenSuccessEmbed(interaction.guild.id, canal.id, queuePos)
  );

  return canal;
}

async function refreshPanel(channel) {
  const meta = getTicketMeta(channel.id) || {};
  if (meta.closed) return;
  const ownerId = getOwner(channel.id);
  if (!ownerId) return;

  let user;
  try {
    user = await channel.client.users.fetch(ownerId);
  } catch {
    return;
  }

  const panelId = getPanelMsg(channel.id);
  if (!panelId) return;

  const queuePos = getQueuePosition(meta.typeId, channel.id, meta.guildId || channel.guildId);
  const cfg = loadConfig(meta.guildId || channel.guildId);
  const panel = buildTicketEmbed({
    user,
    typeLabel: meta.typeLabel,
    status: getStatus(channel.id),
    claimedBy: meta.claimedBy,
    priority: meta.priority || "normal",
    queuePos,
    createdAt: meta.createdAt,
    includePix: !!meta.includePix,
    formSubject: meta.formSubject,
    formDetails: meta.formDetails,
    firstStaffReplyAt: meta.firstStaffReplyAt,
    slaMinutes: cfg.sla?.minutes
  });

  try {
    const msg = await channel.messages.fetch(panelId);
    await msg.edit(panel);
  } catch {}
}

async function closeTicket(channel, closer, opts = {}) {
  const meta = getTicketMeta(channel.id) || {};
  const cfg = loadConfig(meta.guildId || channel.guildId);
  const ownerId = getOwner(channel.id);
  const guildId = meta.guildId || channel.guildId;

  const files = [];
  try {
    const txt = await buildTranscript(channel, cfg.transcriptLimit || 150);
    files.push(txt.file);
  } catch (e) {
    console.error("[transcript txt]", e.message);
  }
  try {
    const html = await buildTranscriptHtml(channel, meta, cfg.transcriptLimit || 150);
    files.push(html.file);
  } catch (e) {
    console.error("[transcript html]", e.message);
  }

  await logTicket(channel.client, {
    guildId,
    title: "Ticket encerrado",
    description: `${channel.name} por **${closer.tag || closer.username}**${
      opts.reason ? `\nMotivo: ${opts.reason}` : ""
    }`,
    color: 0xed4245,
    files
  });

  if (!opts.skipRating && ownerId && cfg.ratingsEnabled !== false) {
    try {
      const user = await channel.client.users.fetch(ownerId);
      setTicketMeta(channel.id, { pendingRating: true, closedAt: Date.now() });
      await user.send(buildRatingMessage(channel.id)).catch(() => {});
    } catch {}
  }

  if (ownerId) removeUserTicket(ownerId, channel.id, guildId);

  setTicketMeta(channel.id, {
    closed: true,
    closedBy: closer.id,
    closedAt: Date.now()
  });

  const delay = (cfg.closeDelaySeconds || 5) * 1000;
  setTimeout(() => channel.delete().catch(() => {}), delay);
}

async function claimTicket(channel, staffUser) {
  setTicketMeta(channel.id, {
    claimedBy: staffUser.id,
    lastActivity: Date.now()
  });
  if (getStatus(channel.id) === "Aguardando") setStatus(channel.id, "Em atendimento");
  await refreshPanel(channel);
  await logTicket(channel.client, {
    guildId: channel.guildId,
    title: "Ticket assumido",
    description: `${channel} · **${staffUser.tag}**`,
    color: 0x57f287
  });
}

async function transferTicket(channel, fromUser, toUserId) {
  setTicketMeta(channel.id, { claimedBy: toUserId, lastActivity: Date.now() });
  setStatus(channel.id, "Em atendimento");
  await refreshPanel(channel);
  await channel.send({ content: `Ticket transferido para <@${toUserId}> por ${fromUser}.` });
  await logTicket(channel.client, {
    guildId: channel.guildId,
    title: "Ticket transferido",
    description: `${channel} → <@${toUserId}>`,
    color: 0x5865f2
  });
}

async function setPriority(channel, priority) {
  setTicketMeta(channel.id, { priority, lastActivity: Date.now() });
  const p = priorityInfo(priority);
  await refreshPanel(channel);
  await channel.send({ content: `Prioridade: **${p.label}**` });
}

async function addMemberToTicket(channel, userId) {
  await channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    AttachFiles: true,
    ReadMessageHistory: true
  });
  setTicketMeta(channel.id, { lastActivity: Date.now() });
}

async function removeMemberFromTicket(channel, userId) {
  const ownerId = getOwner(channel.id);
  if (userId === ownerId) throw new Error("Não pode remover o dono do ticket.");
  await channel.permissionOverwrites.delete(userId);
}

async function renameTicket(channel, name) {
  const clean = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
  await channel.setName(clean);
}

async function logTicket(client, { guildId, title, description, color, files }) {
  const cfg = loadConfig(guildId);
  if (!cfg.logsChannel) return;
  try {
    const ch = await client.channels.fetch(cfg.logsChannel);
    if (!ch) return;
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${cfg.brand || "Ticket"} · ${title}`)
          .setDescription(description)
          .setColor(color ?? getAccent(cfg))
          .setTimestamp()
      ],
      files: files || []
    });
  } catch {}
}

function getStaffTicketList(guild) {
  return listOpenTickets(guild.id)
    .map(m => {
      const ch = guild.channels.cache.get(m.channelId);
      return ch
        ? {
            channel: ch,
            typeLabel: m.typeLabel,
            claimedBy: m.claimedBy,
            priority: m.priority || "normal",
            ownerId: m.ownerId,
            createdAt: m.createdAt,
            formSubject: m.formSubject
          }
        : null;
    })
    .filter(Boolean);
}

function listOpenMetas(guildId = null) {
  return listOpenTickets(guildId);
}

module.exports = {
  openTicket,
  refreshPanel,
  closeTicket,
  claimTicket,
  transferTicket,
  setPriority,
  addMemberToTicket,
  removeMemberFromTicket,
  renameTicket,
  logTicket,
  getQueuePosition,
  listOpenMetas,
  getStaffTicketList
};
