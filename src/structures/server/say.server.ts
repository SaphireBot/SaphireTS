import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import payloadServer from "./payload.server";

export default async function sayServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, guildId, message } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);

  const guildData = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { SayCommand: !(data.SayCommand || false) },
    { upsert: true, new: true },
  ).catch(err => ({ err })) as any;

  if ((guildData as any)?.err)
    return await interaction.update({
      content: t("twitch.error", { e, locale, err: guildData?.err }),
      embeds: [],
      components: [],
    });

  return await interaction.update(await payloadServer(guildData, locale, guild, member));
}