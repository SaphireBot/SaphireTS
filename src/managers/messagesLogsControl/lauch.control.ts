import { ChatInputCommandInteraction, Message, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import Database from "../../database";
import { GuildSchemaType } from "../../database/schemas/guild";
import payloadMessagesControl from "./payload.control";

export default async function lauchMessageControl(
  interaction: StringSelectMenuInteraction<"cached"> | ChatInputCommandInteraction<"cached"> | Message<true>,
  guildData: GuildSchemaType,
) {

  const { member, userLocale: locale, guild, guildId } = interaction;

  if (interaction instanceof StringSelectMenuInteraction)
    if (interaction.message.partial)
      await interaction.message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

  const data = guildData || await Database.getGuild(guildId);
  const payload = await payloadMessagesControl(data, guild, locale, member);

  if (
    interaction instanceof Message
    || interaction instanceof ChatInputCommandInteraction
  )
    return await interaction.reply(payload);

  if (interaction instanceof StringSelectMenuInteraction)
    return await interaction.update(payload);

}