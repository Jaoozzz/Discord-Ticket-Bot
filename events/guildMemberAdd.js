const {
  MessageFlags,
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { loadConfig, getAccent } = require("../utils/configStore");

module.exports = client => {
  client.on("guildMemberAdd", async member => {
    const cfg = loadConfig();
    if (!cfg.welcomeChannel) return;

    const channel = member.guild.channels.cache.get(cfg.welcomeChannel);
    if (!channel) return;

    const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
    const brand = cfg.brand || "Bot Ticket";

    const container = new ContainerBuilder()
      .setAccentColor(getAccent(cfg))
      .addSectionComponents(section =>
        section
          .addTextDisplayComponents(
            t => t.setContent(`# Bem-vindo · ${brand}`),
            t =>
              t.setContent(
                [
                  `Olá ${member} — bem-vindo(a)!`,
                  "",
                  "Se precisar de ajuda, abra um ticket no canal de atendimento."
                ].join("\n")
              )
          )
          .setThumbnailAccessory(th => th.setURL(avatarUrl))
      )
      .addSeparatorComponents(s => s.setSpacing(2).setDivider(true));

    const buttons = [];
    if (cfg.atendimentoUrl) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("Atendimento")
          .setStyle(ButtonStyle.Link)
          .setURL(cfg.atendimentoUrl)
      );
    }
    if (cfg.infoUrl) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("Informações")
          .setStyle(ButtonStyle.Link)
          .setURL(cfg.infoUrl)
      );
    }
    if (buttons.length) {
      container.addActionRowComponents(row => row.setComponents(...buttons));
    }

    await channel
      .send({ flags: MessageFlags.IsComponentsV2, components: [container] })
      .catch(() => {});
  });
};
