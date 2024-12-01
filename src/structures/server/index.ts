import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import publisher from "./publisher.server";
import tempcallServer from "./tempcall.server";
import refreshServer from "./refresh.server";
import autoroleServer from "./autorole.server";
import pearlsServer from "./pearls.server";
import prefixServer from "./prefix.server";
import firstServer from "./first.server";
import chestServer from "./chest.server";
import twitchServer from "./twitch.server";
import gamesServer from "./games.server";
import lauchWelcome from "../welcome/lauch.welcome";
import lauchLeave from "../leave/lauch.leave";
import channelLockServer from "./channelLock.server";
import unblockAllChannelsCommandServer from "./unblockAllChannelsCommand.server";
import channelLockerServer from "./channelLocker.server";
import logSystemServer from "./logsystem.server";
import lauchMessageControl from "../../managers/messagesLogsControl/lauch.control";
import interactionsMessagesControl from "../../managers/messagesLogsControl/interactions.control";
import lauchKickLogs from "../logs/kick/lauch.kick";
import lauchBanLogs from "../logs/ban/lauch.ban";
import switchStateKickLogs from "../logs/kick/switchState.kick";
import setChannelKickLogs from "../logs/kick/setChannel.kick";
import switchStateBanLogs from "../logs/ban/switchState.ban";
import setChannelBanLogs from "../logs/ban/setChannel.ban";

export default async function serverRedirect(
  interaction: StringSelectMenuInteraction<"cached">,
  customData: { c: string, uid: string, src?: "channel_block" | "message" | "kick_channel" | "ban_channel" },
) {

  const { member, userLocale: locale, values, user, message } = interaction;

  if (user.id !== customData.uid)
    return await interaction.reply({
      content: t("tempcall.you_cannot_click_here", { e, locale }),
      ephemeral: true,
    });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  const value = values[0] as "logsystem" | "switch_active" | "games" | "auto_publisher" | "tempcall" | "chest" | "autorole" | "logsystem" | "xpsystem" | "LeaveNotification" | "WelcomeNotification" | "prefix" | "minday" | "first" | "pearls" | "cancel" | "refresh" | "unblock_all" | "switch_kick" | "remove_channel_kick" | "remove_channel_ban" | "switch_ban" | "switch_unban" | "ban";

  if (value === "cancel") return await message?.delete()?.catch(() => { });
  if (customData?.src === "channel_block") return await channelLockerServer(interaction as any);
  if (customData?.src === "message") return await interactionsMessagesControl(interaction);
  if (customData?.src === "kick_channel" || value === "remove_channel_kick") return await setChannelKickLogs(interaction as any, value === "remove_channel_kick");
  if (customData?.src === "ban_channel" || value === "remove_channel_ban") return await setChannelBanLogs(interaction as any, value === "remove_channel_ban");
  if (["switch_ban", "switch_unban", "switch_active"].includes(value)) return await switchStateBanLogs(interaction);

  // @ts-expect-error ignore
  const func = {
    auto_publisher: publisher,
    tempcall: tempcallServer,
    autorole: autoroleServer,
    refresh: refreshServer,
    pearls: pearlsServer,
    prefix: prefixServer,
    first: firstServer,
    chest: chestServer,
    twitch: twitchServer,
    games: gamesServer,
    WelcomeNotification: lauchWelcome,
    LeaveNotification: lauchLeave,
    channelLock: channelLockServer,
    unblock_all: unblockAllChannelsCommandServer,
    logsystem: logSystemServer,
    messages: lauchMessageControl,
    kick: lauchKickLogs,
    ban: lauchBanLogs,
    switch_kick: switchStateKickLogs,
  }[value];

  if (!func)
    return await interaction.reply({
      content: t("server.unavailable", { e, locale }),
      ephemeral: true,
    });

  return await func(interaction);

}