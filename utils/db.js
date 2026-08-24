const { sqlite } = require("./sqlite");

function rowToMeta(row) {
  if (!row) return null;
  let extra = {};
  try {
    extra = row.meta_json ? JSON.parse(row.meta_json) : {};
  } catch {}
  return {
    ownerId: row.owner_id,
    typeId: row.type_id,
    typeLabel: row.type_label,
    status: row.status,
    claimedBy: row.claimed_by,
    priority: row.priority || "normal",
    includePix: !!row.include_pix,
    panelMessageId: row.panel_message_id,
    formSubject: row.form_subject,
    formDetails: row.form_details,
    createdAt: row.created_at,
    lastActivity: row.last_activity,
    firstStaffReplyAt: row.first_staff_reply_at,
    warnedInactive: !!row.warned_inactive,
    warnedSla: !!row.warned_sla,
    closed: !!row.closed,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    guildId: row.guild_id,
    ...extra
  };
}

function getUserTickets(userId, guildId = null) {
  if (guildId) {
    return sqlite
      .prepare(
        `SELECT channel_id FROM user_tickets WHERE user_id = ? AND guild_id = ?`
      )
      .all(userId, guildId)
      .map(r => r.channel_id);
  }
  return sqlite
    .prepare(`SELECT channel_id FROM user_tickets WHERE user_id = ?`)
    .all(userId)
    .map(r => r.channel_id);
}

function setUserTickets(userId, list, guildId) {
  if (!guildId) return;
  sqlite.prepare(`DELETE FROM user_tickets WHERE user_id = ? AND guild_id = ?`).run(userId, guildId);
  const ins = sqlite.prepare(
    `INSERT OR IGNORE INTO user_tickets (guild_id, user_id, channel_id) VALUES (?, ?, ?)`
  );
  for (const ch of list) ins.run(guildId, userId, ch);
}

function addUserTicket(userId, channelId, guildId) {
  if (!guildId) return;
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO user_tickets (guild_id, user_id, channel_id) VALUES (?, ?, ?)`
    )
    .run(guildId, userId, channelId);
}

function removeUserTicket(userId, channelId, guildId = null) {
  if (guildId) {
    sqlite
      .prepare(
        `DELETE FROM user_tickets WHERE user_id = ? AND channel_id = ? AND guild_id = ?`
      )
      .run(userId, channelId, guildId);
  } else {
    sqlite
      .prepare(`DELETE FROM user_tickets WHERE user_id = ? AND channel_id = ?`)
      .run(userId, channelId);
  }
}

function setTicketMeta(channelId, data) {
  const prev = getTicketMeta(channelId) || {};
  const merged = { ...prev, ...data };

  const exists = sqlite.prepare(`SELECT channel_id FROM tickets WHERE channel_id = ?`).get(channelId);

  const payload = {
    channel_id: channelId,
    guild_id: merged.guildId || prev.guildId || "",
    owner_id: merged.ownerId || prev.ownerId || "",
    type_id: merged.typeId ?? prev.typeId ?? null,
    type_label: merged.typeLabel ?? prev.typeLabel ?? null,
    status: merged.status ?? prev.status ?? "Aguardando",
    claimed_by: merged.claimedBy !== undefined ? merged.claimedBy : prev.claimedBy ?? null,
    priority: merged.priority ?? prev.priority ?? "normal",
    include_pix: (merged.includePix !== undefined ? merged.includePix : prev.includePix) ? 1 : 0,
    panel_message_id: merged.panelMessageId ?? prev.panelMessageId ?? null,
    form_subject: merged.formSubject ?? prev.formSubject ?? null,
    form_details: merged.formDetails ?? prev.formDetails ?? null,
    created_at: merged.createdAt ?? prev.createdAt ?? Date.now(),
    last_activity: merged.lastActivity ?? prev.lastActivity ?? Date.now(),
    first_staff_reply_at:
      merged.firstStaffReplyAt !== undefined
        ? merged.firstStaffReplyAt
        : prev.firstStaffReplyAt ?? null,
    warned_inactive: (merged.warnedInactive !== undefined ? merged.warnedInactive : prev.warnedInactive) ? 1 : 0,
    warned_sla: (merged.warnedSla !== undefined ? merged.warnedSla : prev.warnedSla) ? 1 : 0,
    closed: (merged.closed !== undefined ? merged.closed : prev.closed) ? 1 : 0,
    closed_at: merged.closedAt ?? prev.closedAt ?? null,
    closed_by: merged.closedBy ?? prev.closedBy ?? null,
    meta_json: JSON.stringify({
      pendingRating: merged.pendingRating,
      notesPreview: merged.notesPreview
    })
  };

  if (exists) {
    sqlite
      .prepare(
        `UPDATE tickets SET
        guild_id=@guild_id, owner_id=@owner_id, type_id=@type_id, type_label=@type_label,
        status=@status, claimed_by=@claimed_by, priority=@priority, include_pix=@include_pix,
        panel_message_id=@panel_message_id, form_subject=@form_subject, form_details=@form_details,
        created_at=@created_at, last_activity=@last_activity, first_staff_reply_at=@first_staff_reply_at,
        warned_inactive=@warned_inactive, warned_sla=@warned_sla, closed=@closed,
        closed_at=@closed_at, closed_by=@closed_by, meta_json=@meta_json
        WHERE channel_id=@channel_id`
      )
      .run(payload);
  } else {
    sqlite
      .prepare(
        `INSERT INTO tickets (
        channel_id, guild_id, owner_id, type_id, type_label, status, claimed_by, priority,
        include_pix, panel_message_id, form_subject, form_details, created_at, last_activity,
        first_staff_reply_at, warned_inactive, warned_sla, closed, closed_at, closed_by, meta_json
      ) VALUES (
        @channel_id, @guild_id, @owner_id, @type_id, @type_label, @status, @claimed_by, @priority,
        @include_pix, @panel_message_id, @form_subject, @form_details, @created_at, @last_activity,
        @first_staff_reply_at, @warned_inactive, @warned_sla, @closed, @closed_at, @closed_by, @meta_json
      )`
      )
      .run(payload);
  }
}

function getTicketMeta(channelId) {
  const row = sqlite.prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(channelId);
  return rowToMeta(row);
}

function deleteTicketMeta(channelId) {
  // soft: keep for history ratings; hard delete user link
  sqlite.prepare(`UPDATE tickets SET closed = 1, closed_at = ? WHERE channel_id = ?`).run(Date.now(), channelId);
}

function getOwner(channelId) {
  const m = getTicketMeta(channelId);
  return m && !m.closed ? m.ownerId : m?.ownerId || null;
}

function setOwner(channelId, userId) {
  setTicketMeta(channelId, { ownerId: userId });
}

function getPanelMsg(channelId) {
  return getTicketMeta(channelId)?.panelMessageId || null;
}

function setPanelMsg(channelId, messageId) {
  setTicketMeta(channelId, { panelMessageId: messageId });
}

function getStatus(channelId) {
  return getTicketMeta(channelId)?.status || "Aguardando";
}

function setStatus(channelId, status) {
  setTicketMeta(channelId, { status });
}

function countOpenTickets(guildId = null) {
  if (guildId) {
    return sqlite
      .prepare(`SELECT COUNT(*) as n FROM tickets WHERE closed = 0 AND guild_id = ?`)
      .get(guildId).n;
  }
  return sqlite.prepare(`SELECT COUNT(*) as n FROM tickets WHERE closed = 0`).get().n;
}

function listOpenChannelIds(guildId = null) {
  if (guildId) {
    return sqlite
      .prepare(`SELECT channel_id FROM tickets WHERE closed = 0 AND guild_id = ?`)
      .all(guildId)
      .map(r => r.channel_id);
  }
  return sqlite
    .prepare(`SELECT channel_id FROM tickets WHERE closed = 0`)
    .all()
    .map(r => r.channel_id);
}

function listOpenTickets(guildId = null) {
  const rows = guildId
    ? sqlite.prepare(`SELECT * FROM tickets WHERE closed = 0 AND guild_id = ? ORDER BY created_at ASC`).all(guildId)
    : sqlite.prepare(`SELECT * FROM tickets WHERE closed = 0 ORDER BY created_at ASC`).all();
  return rows.map(rowToMeta).map((m, i) => ({ ...m, channelId: rows[i].channel_id }));
}

function addNote(channelId, authorId, content) {
  const r = sqlite
    .prepare(
      `INSERT INTO notes (channel_id, author_id, content, created_at) VALUES (?, ?, ?, ?)`
    )
    .run(channelId, authorId, content, Date.now());
  return r.lastInsertRowid;
}

function getNotes(channelId, limit = 20) {
  return sqlite
    .prepare(
      `SELECT * FROM notes WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(channelId, limit);
}

function addRatingRow(data) {
  sqlite
    .prepare(
      `INSERT INTO ratings (guild_id, channel_id, user_id, staff_id, stars, comment, type_label, created_at)
       VALUES (@guild_id, @channel_id, @user_id, @staff_id, @stars, @comment, @type_label, @created_at)`
    )
    .run({
      guild_id: data.guildId || null,
      channel_id: data.channelId || null,
      user_id: data.userId,
      staff_id: data.staffId || null,
      stars: data.stars,
      comment: data.comment || "",
      type_label: data.typeLabel || "",
      created_at: Date.now()
    });
}

function ratingStats(guildId = null) {
  const rows = guildId
    ? sqlite.prepare(`SELECT * FROM ratings WHERE guild_id = ?`).all(guildId)
    : sqlite.prepare(`SELECT * FROM ratings`).all();
  if (!rows.length) return { count: 0, avg: 0, byStaff: {} };
  const sum = rows.reduce((a, r) => a + r.stars, 0);
  const byStaff = {};
  for (const r of rows) {
    if (!r.staff_id) continue;
    if (!byStaff[r.staff_id]) byStaff[r.staff_id] = { sum: 0, n: 0 };
    byStaff[r.staff_id].sum += r.stars;
    byStaff[r.staff_id].n++;
  }
  return { count: rows.length, avg: +(sum / rows.length).toFixed(2), byStaff, recent: rows.slice(-10).reverse() };
}

module.exports = {
  sqlite,
  getUserTickets,
  setUserTickets,
  addUserTicket,
  removeUserTicket,
  setTicketMeta,
  getTicketMeta,
  deleteTicketMeta,
  getOwner,
  setOwner,
  getPanelMsg,
  setPanelMsg,
  getStatus,
  setStatus,
  countOpenTickets,
  listOpenChannelIds,
  listOpenTickets,
  addNote,
  getNotes,
  addRatingRow,
  ratingStats
};
