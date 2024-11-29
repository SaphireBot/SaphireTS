import { APIEmbed, Colors, Guild, GuildMember, parseEmoji, ChannelType } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import statusServer from "../../structures/server/status.string.server";
import client from "../../saphire";
import { GuildSchemaType } from "../../database/schemas/guild";
import Database from "../../database";

export default async function payloadMessagesControl(data: GuildSchemaType, guild: Guild, locale: string, member: GuildMember): Promise<{ content: any, embeds: APIEmbed[], components: any[] }> {

  const state = {
    active: data?.Logs?.messages?.active || false,
    messageUpdate: data?.Logs?.messages?.messageUpdate || false,
    messageDelete: data?.Logs?.messages?.messageDelete || false,
    messageDeleteBulk: data?.Logs?.messages?.messageDeleteBulk || false,
    messageReactionRemoveAll: data?.Logs?.messages?.messageReactionRemoveAll || false,
    messageReactionRemoveEmoji: data?.Logs?.messages?.messageReactionRemoveEmoji || false,
  };

  let channelState = t("logs.no_channel", locale);
  let channelId = data?.Logs?.messages?.channelId;

  if (channelId) {

    const channel = await guild.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      await Database.Guilds.updateOne(
        { id: guild.id },
        {
          $set: {
            "Logs.messages.channelId": null,
            "Logs.messages.active": false,
          },
        },
        { upsert: true },
      );
      state.active = false;
      channelId = undefined;
    } else channelState = channel.toString();

  }

  return {
    content: t("logs.messages.no_available", { e, locale }),
    embeds: [{
      color: Colors.Blue,
      title: t("logs.embed.title", { locale, guildName: guild.name }),
      description: Object.entries(state)
        .map(([key, enable]) => `${enable ? e.green : e.red} ${t(`logs.messages.${key}`, locale)}`)
        .join("\n")
        .limit("EmbedDescription"),
      fields: [
        {
          name: t("logs.messages.embed.fields.0.name", locale),
          value: channelState,
        },
        {
          name: t("logs.messages.embed.fields.1.name", locale),
          value: statusServer(Object.values(state).concat(channelId ? true : false), locale, "text with emoji"),
        },
      ],
      footer: {
        text: `❤️ ${client.user?.username}'s Guild Experience`,
      },
    }],
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: JSON.stringify({ c: "server", uid: member.id, src: "message" }),
            placeholder: t("server.components.select_menu.principal_placeholder", locale),
            min_values: 1,
            max_values: 7,
            options: [
              {
                label: t("leave.components.select_menu.config.options.0.label", locale),
                emoji: parseEmoji(e.Gear),
                description: t("leave.components.select_menu.config.options.0.description", locale),
                value: "refresh",
              },
              {
                label: t("server.services.logsystem", locale),
                emoji: parseEmoji("⏪"),
                description: t("logs.components.select_menu.descriptions.central", locale),
                value: "logsystem",
              },
              channelId
                ? {
                  label: t("logs.components.select_menu.labels.remove_channel", locale),
                  emoji: parseEmoji(e.Trash),
                  description: t("logs.components.select_menu.descriptions.remove_channel", locale),
                  value: "remove_channel",
                }
                : undefined,
              Object.entries(state)
                .map(([key, enable]) => ({
                  emoji: parseEmoji(enable ? e.green : e.red),
                  label: t(`logs.messages.components.${key}`, locale),
                  description: enable ? t("keyword_enable", locale) : t("keyword_disable", locale),
                  value: key,
                })),
              {
                label: t("keyword_cancel", locale),
                emoji: e.DenyX,
                description: t("help.selectmenu.options.4.description", locale),
                value: "cancel",
              },
            ]
              .filter(Boolean)
              .flat(),
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 8,
            custom_id: JSON.stringify({ c: "server", uid: member.id, src: "message", id: "0" }),
            placeholder: t("logs.components.select_menu.placeholders.choose_channel", locale),
            channel_types: [
              ChannelType.GuildAnnouncement,
              ChannelType.GuildText,
            ],
          },
        ],
      },
    ],
  };
}