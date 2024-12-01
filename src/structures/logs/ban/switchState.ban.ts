import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import Database from "../../../database";
import banPayload from "./payload.ban";

// Tomei esporro da Sarah, help
export default async function switchStateBanLogs(
  interaction: StringSelectMenuInteraction<"cached">,
) {

  const state = {
    "switch_ban": "ban",
    "switch_unban": "unban",
    "switch_active": "active",
  };

  const { member, userLocale: locale, guild, guildId, message, values } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const guildData = await Database.getGuild(guildId);
  const params: Record<string, boolean> = {};

  for (const value of values as (keyof typeof state)[])
    // @ts-expect-error error
    params[`Logs.ban.${state[value]}`] = !((guildData?.Logs?.ban?.[state[value]] as any) ? true : false);

  let data = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    params,
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