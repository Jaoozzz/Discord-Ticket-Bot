const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { loadConfig } = require("./utils/configStore");
const { startAutoClose } = require("./utils/autoClose");
const { startBackupInterval } = require("./utils/backup");
const { startSlaChecker } = require("./utils/sla");

const config = loadConfig();

if (!config.token) {
  console.error("Configure o token em config.json");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) client.commands.set(command.data.name, command);
}

require("./events/interactionCreate")(client);
require("./events/guildMemberAdd")(client);
require("./events/messageCreate")(client);

async function registerCommands() {
  const body = [...client.commands.values()].map(c => c.data.toJSON());
  try {
    await client.application.commands.set([]);
    for (const guild of client.guilds.cache.values()) {
      await client.application.commands.set(body, guild.id);
      console.log(`Comandos em: ${guild.name} (${body.length})`);
    }
  } catch (e) {
    console.error("Erro ao registrar comandos:", e.message);
  }
}

client.once("ready", async () => {
  const cfg = loadConfig();
  console.log(`${cfg.brand || "Bot"} online como ${client.user.tag}`);
  console.log(`Client ID: ${client.user.id}`);
  await registerCommands();

  startAutoClose(client);
  startSlaChecker(client);
  startBackupInterval(6);

  const brand = cfg.brand || "Bot Ticket";
  const statuses = [
    { name: `${brand} · Tickets`, type: ActivityType.Custom },
    { name: "/painel · /staff", type: ActivityType.Custom },
    { name: brand, type: ActivityType.Custom }
  ];
  let i = 0;
  client.user.setPresence({ activities: [statuses[0]], status: "online" });
  setInterval(() => {
    i = (i + 1) % statuses.length;
    client.user.setPresence({ activities: [statuses[i]], status: "online" });
  }, 12000);
});

client.login(config.token).catch(err => {
  console.error("Login falhou:", err.message);
  process.exit(1);
});
