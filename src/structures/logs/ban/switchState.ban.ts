import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import Database from "../../../database";
import banPayload from "./payload.ban";

// Tomei esporro da Sarah, help
export default async function switchStateBanLogs(
  interaction: StringSelectMenuInteraction<"cached">,
  stateValue: "switch_ban" | "switch_unban" | "switch_active",
) {

  const state = {
    "switch_ban": "ban",
    "switch_unban": "unban",
    "switch_active": "active",
  }[stateValue] as "ban" | "unban" | "active";

  const { member, userLocale: locale, guild, guildId, message } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const guildData = await Database.getGuild(guildId);
  let data = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { [`Logs.ban.${state}`]: !(guildData?.Logs?.ban?.[state] || false) },
    { upsert: true, new: true },
  );

  const channelId = data?.Logs?.ban?.channelId;
  const channel = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null;

  if (channelId && !channel)
    data = await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $unset: { "Logs.ban.channelId": true } },
      { upsert: true, new: true },
    );

  return await interaction.update(banPayload(guild, locale, channel, data, member));
}