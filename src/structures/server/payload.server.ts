import { Guild, GuildMember, Colors, PermissionFlagsBits } from "discord.js";
import { GuildSchemaType } from "../../database/schemas/guild";
import client from "../../saphire";
import { ChannelsInGame } from "../../util/constants";
import { e } from "../../util/json";
import { t } from "../../translator";
import socket from "../../services/api/ws";
import statusServer from "./status.string.server";

export default async function payloadServer(data: GuildSchemaType, locale: string, guild: Guild | null, member: GuildMember): Promise<any> {

  if (!guild) return;
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

  const twitchStreamers = (await socket.twitch?.getGuildData(guild.id));
  const channelBlocks = data.ChannelsCommandBlock?.length || 0;

  const logsState = [
    data?.Logs?.GSN?.active || false,
    data?.Logs?.ban?.active || false,
    data?.Logs?.kick?.active || false,
    data?.Logs?.mute?.active || false,
    data?.Logs?.channels?.active || false,
    data?.Logs?.messages?.active || false,
    data?.Logs?.bots?.active || false,
    data?.Logs?.roles?.active || false,
  ];

  const descriptionRawData = [
    { enable: [data.AutoPublisher || false], translateKey: "server.services.auto_publisher", emoji: "🔊", key: "auto_publisher" },
    { enable: [data.TempCall?.enable || false], translateKey: "server.services.tempcall", emoji: "⏱️", key: "tempcall" },
    { enable: [data.Chest || false], translateKey: "server.services.chest", emoji: e.SaphireChest, key: "chest" },
    { enable: [data.Autorole?.length > 0], translateKey: "server.services.autorole", emoji: "🛃", key: "autorole" },
    { enable: logsState, translateKey: "server.services.logsystem", emoji: "🔎", key: "logsystem" },
    { enable: [data.XpSystem?.Canal ? true : false], translateKey: "server.services.xpsystem", emoji: e.RedStar, key: "xpsystem" },
    { enable: [data.LeaveNotification?.active || false], translateKey: "server.services.LeaveNotification", emoji: e.Leave, key: "LeaveNotification" },
    { enable: [data.WelcomeNotification?.active || false], translateKey: "server.services.WelcomeNotification", emoji: e.Join, key: "WelcomeNotification" },
    { enable: [data.Pearls?.channelId ? true : false], translateKey: "server.services.pearls", emoji: "🌟", key: "pearls" },
    { enable: [(data.MinDay?.days || 0) > 0], translateKey: "server.services.minday", emoji: "🤖", key: "minday" },
    { enable: [isCustomPrefixes], translateKey: "server.services.prefix", emoji: "🔣", key: "prefix" },
    { enable: [data?.FirstSystem || false], translateKey: "server.services.first", emoji: "💭", key: "first" },
    { enable: [twitchStreamers?.length > 0], translateKey: "server.services.twitch", emoji: e.twitch, key: "twitch" },
    { enable: [channels > 0], translateKey: "server.services.games", emoji: "🎮", key: "games" },
    { enable: [channelBlocks > 0], translateKey: "server.services.channelLock", emoji: e.slash, key: "channelLock" },
    { enable: [data.SayCommand || false], translateKey: "server.services.say", emoji: "🗣️", key: "say" },
  ] as { enable: boolean[], translateKey: string, emoji: string, key: string }[];

  return {
    content: null,
    embeds: [{
      color: Colors.Blue,
      title: t("server.embeds.title", { e, locale }),
      description: descriptionRawData
        .map(({ enable, translateKey }) => `${statusServer(enable, locale, "emoji")} ${t(translateKey, { locale, channels, channelBlocks })}`)
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
                  description: statusServer(enable, locale, "text"),
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