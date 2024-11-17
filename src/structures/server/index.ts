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

export default async function serverRedirect(interaction: StringSelectMenuInteraction<"cached">, customData: { c: string, uid: string }) {

  const { member, userLocale: locale, values, user, message } = interaction;

  if (user.id !== customData.uid)
    return await interaction.reply({
      content: t("tempcall.you_cannot_click_here", { e, locale }),
      ephemeral: true,
    });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  const value = values[0] as "games" | "auto_publisher" | "tempcall" | "chest" | "autorole" | "logsystem" | "xpsystem" | "LeaveNotification" | "WelcomeNotification" | "prefix" | "minday" | "first" | "pearls" | "cancel" | "refresh";

  if (value === "cancel")
    return await message?.delete()?.catch(() => { });

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
  }[value];

  if (!func)
    return await interaction.reply({
      content: t("server.unavailable", { e, locale }),
      ephemeral: true,
    });

  return func(interaction);

}