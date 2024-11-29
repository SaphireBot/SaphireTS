import { ChannelSelectMenuInteraction, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import Database from "../../../database";
import kickPayload from "./payload.logs";

export default async function setChannelMessages(
  interaction: ChannelSelectMenuInteraction<"cached">,
) {

  const { member, userLocale: locale, guild, guildId, message, values } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const channel = await guild.channels.fetch(values[0]).catch(() => null);

  const data = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { $set: { "Logs.kick.channelId": values[0] } },
    { upsert: true, new: true },
  );

  return await interaction.update(kickPayload(guild, locale, channel, data?.Logs?.kick?.active || false, member));
}