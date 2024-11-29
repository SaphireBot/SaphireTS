import { ChannelType, Colors, Guild, GuildMember, parseEmoji, GuildBasedChannel } from "discord.js";
import { t } from "../../../translator";
import client from "../../../saphire";
import { e } from "../../../util/json";
import statusServer from "../../server/status.string.server";

export default function kickPayload(guild: Guild, locale: string, channel: GuildBasedChannel | undefined | null, active: boolean, member: GuildMember) {
  return {
    content: undefined,
    embeds: [{
      color: Colors.Blue,
      title: t("logs.embed.title", { locale, guildName: guild.name }),
      description: t("logs.kick.description", locale),
      fields: [
        {
          name: t("logs.messages.embed.fields.0.name", locale),
          value: channel?.toString() || t("logs.no_channel", locale),
        },
        {
          name: t("logs.messages.embed.fields.1.name", locale),
          value: statusServer([active, channel?.id ? true : false], locale, "text with emoji"),
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
            custom_id: JSON.stringify({ c: "server", uid: member.id, src: "kick" }),
            placeholder: t("server.components.select_menu.principal_placeholder", locale),
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
              channel
                ? {
                  label: t("logs.components.select_menu.labels.remove_channel", locale),
                  emoji: parseEmoji(e.Trash),
                  description: t("logs.components.select_menu.descriptions.remove_channel", locale),
                  value: "remove_channel_kick",
                }
                : undefined,
              {
                label: t("logs.messages.components.active", locale),
                emoji: parseEmoji(active ? e.green : e.red),
                description: active ? t("keyword_enable", locale) : t("keyword_disable", locale),
                value: "switch_kick",
              },
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
            custom_id: JSON.stringify({ c: "server", uid: member.id, src: "kick_channel" }),
            placeholder: t("logs.components.select_menu.placeholders.choose_channel", locale),
            channel_types: [
              ChannelType.GuildAnnouncement,
              ChannelType.GuildText,
            ],
          },
        ],
      },
    ].asMessageComponents(),
  };
}