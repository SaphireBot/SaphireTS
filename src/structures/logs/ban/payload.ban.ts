import { ChannelType, Colors, Guild, GuildMember, parseEmoji, GuildBasedChannel } from "discord.js";
import { t } from "../../../translator";
import client from "../../../saphire";
import { e } from "../../../util/json";
import statusServer from "../../server/status.string.server";
import { GuildSchemaType } from "../../../database/schemas/guild";

export default function payloadBan(guild: Guild, locale: string, channel: GuildBasedChannel | undefined | null, data: GuildSchemaType, member: GuildMember) {

  const log = data?.Logs?.ban || {};
  const active = log.active || false;
  const ban = log.ban || false;
  const unban = log.unban || false;

  return {
    content: undefined,
    embeds: [{
      color: Colors.Blue,
      title: t("logs.embed.title", { locale, guildName: guild.name }),
      description: t("logs.ban.description", locale),
      fields: [
        {
          name: t("logs.messages.embed.fields.0.name", locale),
          value: `${channel?.toString() || t("logs.no_channel", locale)}\n`,
        },
        {
          name: t("logs.ban.activation", locale),
          value: t("logs.ban.embed.field_value", {
            locale,
            active: statusServer([active], locale, "text with emoji"),
            ban: statusServer([ban], locale, "emoji"),
            unban: statusServer([unban], locale, "emoji"),
          }),
        },
        {
          name: t("logs.messages.embed.fields.1.name", locale),
          value: statusServer([active, ban, unban, channel?.id ? true : false], locale, "text with emoji"),
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
            custom_id: JSON.stringify({ c: "server", uid: member.id, src: "ban" }),
            placeholder: t("server.components.select_menu.principal_placeholder", locale),
            max_values: 3,
            min_values: 1,
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
                  value: "remove_channel_ban",
                }
                : undefined,
              {
                label: t("logs.messages.components.active", locale),
                emoji: parseEmoji(active ? e.green : e.red),
                description: statusServer([active], locale, "text"),
                value: "switch_active",
              },
              {
                label: t("logs.ban.ban_notify", locale),
                emoji: parseEmoji(ban ? e.green : e.red),
                description: statusServer([ban], locale, "text"),
                value: "switch_ban",
              },
              {
                label: t("logs.ban.unban_notify", locale),
                emoji: parseEmoji(unban ? e.green : e.red),
                description: statusServer([unban], locale, "text"),
                value: "switch_unban",
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
            custom_id: JSON.stringify({ c: "server", uid: member.id, src: "ban_channel" }),
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