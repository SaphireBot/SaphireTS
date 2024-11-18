import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import Database from "../../database";
import configLeave from "./config.leave";
import { e } from "../../util/json";

export default async function memberThumbnailLeave(interaction: StringSelectMenuInteraction<"cached">) {

  const { guild, member, guildId, userLocale: locale, message } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  await interaction.update({ components: [], embeds: [], content: e.Animated.SaphireReading });
  const data = await Database.getGuild(guildId);

  await Database.Guilds.updateOne(
    { id: guildId },
    { $set: { "LeaveNotification.thumbnailImage": !(data.LeaveNotification?.thumbnailImage || false) } },
    { upsert: true }
  );

  await sleep(2000);
  return await configLeave(interaction, "update");
}