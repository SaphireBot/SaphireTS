import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import lauchMessageControl from "./lauch.control";
import Database from "../../database";

export default async function switchControl(
  interaction: StringSelectMenuInteraction<"cached">,
  keys: ("messageUpdate" | "messageDelete" | "messageDeleteBulk" | "messageReactionRemoveAll" | "messageReactionRemoveEmoji" | "active" | "remove_channel")[],
) {

  const { member, guild, guildId } = interaction;

  if (interaction instanceof StringSelectMenuInteraction)
    if (interaction.message.partial)
      await interaction.message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  const options: Record<string, boolean | null> = {};

  for (const key of keys)
    if (key === "remove_channel") options["Logs.messages.channelId"] = null;
    else options[`Logs.messages.${key}`] = !data?.Logs?.messages?.[key];

  const guildData = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    options,
    { upsert: true, new: true },
  );

  return await lauchMessageControl(interaction, guildData);
}