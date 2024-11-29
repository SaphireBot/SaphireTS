import { ChannelSelectMenuInteraction, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import payloadMessagesControl from "./payload.control";

export default async function setChannelMessages(
  interaction: ChannelSelectMenuInteraction<"cached">,
) {

  const { member, userLocale: locale, guild, guildId, message, values } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const data = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { "Logs.messages.channelId": values[0] },
    { upsert: true, new: true },
  );

  return await interaction.update(await payloadMessagesControl(data, guild, locale, member));
}