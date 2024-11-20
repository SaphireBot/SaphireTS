import { ButtonInteraction, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import payloadServer from "./payload.server";

export default async function refreshServer(interaction: StringSelectMenuInteraction<"cached"> | ButtonInteraction<"cached">) {

  const { member, userLocale: locale, guild, guildId, message } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  return await interaction.update(await payloadServer(data, locale, guild, member));

}