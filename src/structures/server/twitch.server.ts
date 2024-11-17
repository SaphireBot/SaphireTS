import { PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import list from "../../commands/functions/twitch/list";

export default async function twitchServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, message } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_client_need_some_permissions");

  await list(interaction);

  await sleep(1000);
  return await interaction.followUp({
    content: t("server.you_need_refresh", { e, locale }),
    ephemeral: true,
  });
}