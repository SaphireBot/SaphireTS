import { Guild, GuildMember, Colors, PermissionFlagsBits } from "discord.js";
import { GuildSchemaType } from "../../database/schemas/guild";
import client from "../../saphire";
import { ChannelsInGame } from "../../util/constants";
import { e } from "../../util/json";
import { t } from "../../translator";
import socket from "../../services/api/ws";

export default async function payloadServer(data: GuildSchemaType, locale: string, guild: Guild, member: GuildMember): Promise<any> {

  let isCustomPrefixes = false;

  if (!data.Prefixes?.length) data.Prefixes = client.defaultPrefixes;
  if (data.Prefixes?.length === 2)
    isCustomPrefixes = !(
      client.defaultPrefixes.includes(data.Prefixes[0])
      && client.defaultPrefixes.includes(data.Prefixes[1])
    );
  else isCustomPrefixes = true;

  let channels = 0;

  const channelsId = Array.from(
    new Set(
      (
        await guild.channels.fetch()?.catch(() => null)
      )?.map(ch => ch?.id),
    ),
  ) as string[];

  for (const channelId of channelsId)
    if (ChannelsInGame.has(channelId))
      channels++;

  const twitchStreamers = (await socket.twitch.getGuildData(guild.id));
  const channelBlocks = data.ChannelsCommandBlock?.length || 0;

  const descriptionRawData = [
    { enable: data.AutoPublisher, translateKey: "server.services.auto_publisher", emoji: "🔊", key: "auto_publisher" },
    { enable: data.TempCall?.enable, translateKey: "server.services.tempcall", emoji: "⏱️", key: "tempcall" },
    { enable: data.Chest, translateKey: "server.services.chest", emoji: e.SaphireChest, key: "chest" },
    { enable: data.Autorole?.length > 0, translateKey: "server.services.autorole", emoji: "🛃", key: "autorole" },
    { enable: data.LogSystem?.channel, translateKey: "server.services.logsystem", emoji: "🔎", key: "logsystem" },
    { enable: data.XpSystem?.Canal, translateKey: "server.services.xpsystem", emoji: e.RedStar, key: "xpsystem" },
    { enable: data.LeaveNotification?.active, translateKey: "server.services.LeaveNotification", emoji: e.Leave, key: "LeaveNotification" },
    { enable: data.WelcomeNotification?.active, translateKey: "server.services.WelcomeNotification", emoji: e.Join, key: "WelcomeNotification" },
    { enable: data.Pearls?.channelId, translateKey: "server.services.pearls", emoji: "🌟", key: "pearls" },
    { enable: (data.MinDay?.days || 0) > 0, translateKey: "server.services.minday", emoji: "🤖", key: "minday" },
    { enable: isCustomPrefixes, translateKey: "server.services.prefix", emoji: "🔣", key: "prefix" },
    { enable: data?.FirstSystem, translateKey: "server.services.first", emoji: "💭", key: "first" },
    { enable: twitchStreamers?.length > 0, translateKey: "server.services.twitch", emoji: e.twitch, key: "twitch" },
    { enable: channels > 0, translateKey: "server.services.games", emoji: "🎮", key: "games" },
    { enable: channelBlocks > 0, translateKey: "server.services.channelLock", emoji: e.slash, key: "channelLock" },
  ] as { enable: boolean, translateKey: string, emoji: string, key: string }[];

  return {
    embeds: [{
      color: Colors.Blue,
      title: t("server.embeds.title", { e, locale }),
      description: descriptionRawData
        .map(({ enable, translateKey }) => `${emoji(enable || false)} ${t(translateKey, { locale, channels, channelBlocks })}`)
        .join("\n")
        .limit("EmbedDescription"),
      footer: {
        text: `♥️ ${client.user?.username}'s Guild Services`,
      },
    }],
    components: !member?.permissions?.has(PermissionFlagsBits.Administrator)
      ? []
      : [{
        type: 1,
        components: [
          {
            type: 3,
            custom_id: JSON.stringify({ c: "server", uid: member.id }),
            placeholder: t("server.components.select_menu.principal_placeholder", locale),
            options: [
              {
                label: t("transactions.components.label.refresh", locale),
                emoji: e.Loading,
                description: t("server.components.select_menu.refresh_description", locale),
                value: "refresh",
              },
              descriptionRawData
                .map(({ enable, translateKey, emoji, key }) => ({
                  label: t(translateKey, { locale, channels, channelBlocks }),
                  emoji,
                  description: enable ? t("keyword_enable", locale) : t("keyword_disable", locale),
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
      }],
  };
}

function emoji(enable: boolean) {
  return enable ? e.green_light : e.red_light;
}