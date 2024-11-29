import { ChannelSelectMenuInteraction, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import Database from "../../../database";
import banPayload from "./payload.ban";

export default async function setChannelBanLogs(
  interaction: ChannelSelectMenuInteraction<"cached">,
  removeChannel?: boolean,
) {

  const { member, guild, guildId, userLocale: locale, message, values } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_client_need_some_permissions");

  const params = removeChannel
    ? { $unset: { "Logs.ban.channelId": true } }
    : { $set: { "Logs.ban.channelId": values[0] } };

  const data = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    params,
    { upsert: true, new: true },
  );

  const channel = data?.Logs?.ban?.channelId ? await guild.channels.fetch(values[0]).catch(() => undefined) : undefined;
  return await interaction.update(banPayload(guild, locale, channel, data, member));

}