import { APIEmbed, ButtonInteraction, ChatInputCommandInteraction, Colors, Message, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import statusServer from "./status.string.server";

const emojis = {
  "GSN": "🛰️",
  "ban": "🔨",
  "kick": "🦶",
  "mute": "🔇",
  "channels": "#️⃣",
  "messages": "💭",
  "bots": "🤖",
  "roles": "💼",
};

type logsKeys = keyof typeof emojis;

export default async function logSystemServer(
  interaction: Message<true> | StringSelectMenuInteraction<"cached"> | ButtonInteraction<"cached"> | ChatInputCommandInteraction<"cached">,
) {

  const { member, userLocale: locale, guild, guildId } = interaction;

  if (
    !(interaction instanceof Message)
    && !(interaction instanceof ChatInputCommandInteraction)
  )
    if (interaction.message?.partial) await interaction.message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  const logs = data?.Logs || {};

  const logsState = {
    "messages": [
      data?.Logs?.messages?.active || false,
      data?.Logs?.messages?.channelId ? true : false,
      data?.Logs?.messages?.messageUpdate || false,
      data?.Logs?.messages?.messageDelete || false,
      data?.Logs?.messages?.messageDeleteBulk || false,
      data?.Logs?.messages?.messageReactionRemoveAll || false,
      data?.Logs?.messages?.messageReactionRemoveEmoji || false,
    ],
    "kick": [
      data?.Logs?.kick?.active || false,
      data?.Logs?.kick?.channelId ? true : false,
    ],
  };

  const components = [{
    type: 1,
    components: [
      {
        type: 3,
        custom_id: JSON.stringify({ c: "server", uid: member.id }),
        placeholder: t("server.components.select_menu.principal_placeholder", locale),
        options: [
          {
            label: t("leave.components.select_menu.config.options.0.label", locale),
            emoji: parseEmoji(e.Gear),
            description: t("leave.components.select_menu.config.options.0.description", locale),
            value: "refresh",
          },
          {
            label: t("transactions.components.label.refresh", locale),
            emoji: parseEmoji(e.Loading),
            description: t("server.components.select_menu.refresh_description", locale),
            value: "logsystem",
          },
          Object.keys(emojis)
            .map(key => ({
              emoji: parseEmoji(emojis[key as logsKeys]),
              label: t(`logs.components.select_menu.labels.${key}`, locale),
              description: t(`logs.components.select_menu.descriptions.${key}`, locale),
              value: key,
            })),
          {
            label: t("keyword_cancel", locale),
            emoji: e.DenyX,
            description: t("help.selectmenu.options.4.description", locale),
            value: "cancel",
          },
        ].flat(),
      },
    ],
  }];

  const embed: APIEmbed = {
    color: Colors.Blue,
    title: t("logs.embed.title", { locale, guildName: guild.name }),
    description: Object.keys(emojis)
      .map(key => {

        const state = logsState[key as keyof typeof logsState] as any[] | undefined;

        if (state)
          return `${statusServer(state, locale, "emoji")} ${t(`logs.components.select_menu.labels.${key}`, locale)}`;

        return `${logs[key as logsKeys]?.active ? e.green : e.red} ${t(`logs.components.select_menu.labels.${key}`, locale)}`;
      })
      .join("\n")
      .limit("EmbedDescription"),
    footer: {
      text: `❤️ ${client.user?.username}'s Guild Experience`,
    },
  };

  if (
    interaction instanceof Message
    || interaction instanceof ChatInputCommandInteraction
  )
    return await interaction.reply({ content: undefined, embeds: [embed], components });

  if (
    interaction instanceof StringSelectMenuInteraction
    || interaction instanceof ButtonInteraction
  )
    return await interaction.update({ content: undefined, embeds: [embed], components });

}