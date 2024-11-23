import { ChannelSelectMenuInteraction, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import channelLockServer from "./channelLock.server";

export default async function channelLockerServer(interaction: ChannelSelectMenuInteraction<"cached">) {

  const { member, guild, guildId, message, values } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

  if (values.length)
    await Database.Guilds.updateOne(
      { id: guildId },
      { $addToSet: { ChannelsCommandBlock: { $each: values } } },
      { upsert: true },
    );
  else
    await Database.Guilds.updateOne(
      { id: guildId },
      { $set: { ChannelsCommandBlock: [] } },
      { upsert: true },
    );

  return await channelLockServer(interaction);

}