import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import Database from "../../../database";
import kickPayload from "./payload.logs";

// Tomei esporro da Sarah, help
export default async function switchChannelKickLogs(
  interaction: StringSelectMenuInteraction<"cached">,
) {

  const { member, userLocale: locale, guild, guildId, message } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const guildData = await Database.getGuild(guildId);
  const data = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { "Logs.kick.active": !(guildData?.Logs?.kick?.active || false) },
    { upsert: true, new: true },
  );

  const channelId = data?.Logs?.kick?.channelId;
  const channel = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null;

  if (channelId && !channel)
    await Database.Guilds.updateOne(
      { id: guildId },
      { $unset: { "Logs.kick.channelId": true } },
      { upsert: true },
    );

  return await interaction.update(kickPayload(guild, locale, channel, data?.Logs?.kick?.active || false, member));
}