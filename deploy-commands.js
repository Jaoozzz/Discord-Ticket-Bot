// deploy-commands.js
// Registra os slash commands manualmente. Rode com: node deploy-commands.js
//
// Se "guildId" estiver preenchido no config.json, registra só nesse servidor
// (aparece na hora). Sem "guildId", registra global (pode levar até 1h pra propagar).

const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const { loadConfig } = require("./utils/configStore");

const config = loadConfig();

if (!config.token) {
  console.error("Configure o token em config.json antes de rodar este script.");
  process.exit(1);
}

if (!config.clientId) {
  console.error("Configure o clientId em config.json antes de rodar este script.");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`Ignorado: ${file} não exporta um "data" válido.`);
  }
}

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log(`Registrando ${commands.length} comando(s)...`);

    if (config.guildId) {
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`OK — ${data.length} comando(s) registrados no servidor ${config.guildId}.`);
    } else {
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log(`OK — ${data.length} comando(s) registrados globalmente.`);
      console.log("Comandos globais podem levar até 1 hora para aparecer em todos os servidores.");
    }
  } catch (error) {
    console.error("Falha ao registrar comandos:", error);
    process.exit(1);
  }
})();
