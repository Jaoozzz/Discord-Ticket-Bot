const { AttachmentBuilder } = require("discord.js");

async function fetchMessages(channel, limit = 150) {
  const messages = [];
  let lastId;
  while (messages.length < limit) {
    const batch = await channel.messages.fetch({
      limit: Math.min(100, limit - messages.length),
      ...(lastId ? { before: lastId } : {})
    });
    if (!batch.size) break;
    const arr = [...batch.values()];
    messages.push(...arr);
    lastId = arr[arr.length - 1].id;
    if (batch.size < 100) break;
  }
  messages.reverse();
  return messages;
}

async function buildTranscript(channel, limit = 150) {
  const messages = await fetchMessages(channel, limit);
  const lines = [
    `Transcript · #${channel.name}`,
    `Canal ID: ${channel.id}`,
    `Gerado em: ${new Date().toISOString()}`,
    `Mensagens: ${messages.length}`,
    "".padEnd(40, "=")
  ];
  for (const m of messages) {
    const time = m.createdAt.toISOString().replace("T", " ").slice(0, 19);
    const author = `${m.author.tag} (${m.author.id})`;
    let content = m.content || "";
    if (m.attachments.size) {
      content +=
        (content ? "\n" : "") +
        [...m.attachments.values()].map(a => `[file] ${a.url}`).join("\n");
    }
    if (m.embeds.length && !content) content = "[embed]";
    lines.push(`[${time}] ${author}:`);
    lines.push(content || "(vazio)");
    lines.push("");
  }
  const text = lines.join("\n");
  const file = new AttachmentBuilder(Buffer.from(text, "utf8"), {
    name: `transcript-${channel.id}.txt`
  });
  return { text, file, count: messages.length, messages };
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buildTranscriptHtml(channel, meta = {}, limit = 150) {
  const messages = await fetchMessages(channel, limit);
  const rows = messages
    .map(m => {
      const time = m.createdAt.toISOString().replace("T", " ").slice(0, 19);
      let content = escapeHtml(m.content || "");
      if (m.attachments.size) {
        content +=
          (content ? "<br>" : "") +
          [...m.attachments.values()]
            .map(a => `<a href="${escapeHtml(a.url)}">📎 ${escapeHtml(a.name)}</a>`)
            .join("<br>");
      }
      if (!content && m.embeds.length) content = "<em>[embed]</em>";
      const bot = m.author.bot ? " bot" : "";
      return `<div class="msg${bot}">
        <div class="meta"><span class="author">${escapeHtml(m.author.tag)}</span>
        <span class="time">${time}</span></div>
        <div class="body">${content || "<em>(vazio)</em>"}</div>
      </div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Transcript #${escapeHtml(channel.name)}</title>
<style>
  body{font-family:Segoe UI,system-ui,sans-serif;background:#0b0b0f;color:#e8e8ed;margin:0;padding:24px}
  .wrap{max-width:860px;margin:0 auto}
  h1{font-size:1.4rem;margin:0 0 4px}
  .sub{color:#9a9aab;margin-bottom:20px;font-size:.9rem}
  .card{background:#14141c;border:1px solid #222232;border-radius:12px;padding:16px 18px;margin-bottom:16px}
  .msg{padding:10px 12px;border-radius:8px;margin:6px 0;background:#1a1a24}
  .msg.bot{background:#151a22;border-left:3px solid #5865f2}
  .meta{font-size:.78rem;color:#8b8b9a;margin-bottom:4px}
  .author{color:#fff;font-weight:600;margin-right:8px}
  .body{white-space:pre-wrap;word-break:break-word;line-height:1.45}
  a{color:#7aa2ff}
  .pill{display:inline-block;background:#222232;padding:2px 8px;border-radius:999px;font-size:.75rem;margin-right:6px}
</style>
</head>
<body>
<div class="wrap">
  <h1>Transcript · #${escapeHtml(channel.name)}</h1>
  <div class="sub">
    <span class="pill">${escapeHtml(meta.typeLabel || "ticket")}</span>
    <span class="pill">${messages.length} msgs</span>
    <span class="pill">${new Date().toLocaleString("pt-BR")}</span>
  </div>
  <div class="card">
    ${meta.formSubject ? `<p><strong>Assunto:</strong> ${escapeHtml(meta.formSubject)}</p>` : ""}
    ${meta.formDetails ? `<p><strong>Detalhes:</strong> ${escapeHtml(meta.formDetails)}</p>` : ""}
    ${meta.ownerId ? `<p><strong>User:</strong> ${escapeHtml(meta.ownerId)}</p>` : ""}
    ${meta.claimedBy ? `<p><strong>Staff:</strong> ${escapeHtml(meta.claimedBy)}</p>` : ""}
  </div>
  <div class="card">${rows || "<em>Sem mensagens</em>"}</div>
</div>
</body>
</html>`;

  const file = new AttachmentBuilder(Buffer.from(html, "utf8"), {
    name: `transcript-${channel.id}.html`
  });
  return { html, file, count: messages.length, messages };
}

module.exports = { buildTranscript, buildTranscriptHtml, fetchMessages };
