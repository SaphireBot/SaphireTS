import { ButtonInteraction, ChatInputCommandInteraction, Message, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import Database from "../../../database";
import kickPayload from "./payload.logs";

export default async function kickLogs(
  interaction: StringSelectMenuInteraction<"cached"> | Message<true> | ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
) {

  const { member, guild, guildId, userLocale: locale } = interaction;

  if (interaction instanceof StringSelectMenuInteraction)
    if (interaction.message?.partial) await interaction.message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  const { active, channelId } = data.Logs?.kick || {};
  const channel = channelId ? await guild.channels.fetch(channelId).catch(() => undefined) : undefined;

  if (!channel) await disableChannel();

  const payload = kickPayload(guild, locale, channel, active || false, member);

  if (
    interaction instanceof Message
    || interaction instanceof ChatInputCommandInteraction
  ) return await interaction.reply(payload);

  if (
    interaction instanceof StringSelectMenuInteraction
    || interaction instanceof ButtonInteraction
  ) return await interaction.update(payload);

  async function disableChannel() {
    await Database.Guilds.updateOne(
      { id: guildId },
      { $unset: { "Logs.kick.channelId": true } },
      { upsert: true },
    );
  }

}