import { MessageFlags, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import autorole from "../../commands/functions/autorole";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function autoroleServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, message } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageRoles, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageRoles, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageRoles], "Discord_client_need_some_permissions");

  await autorole(interaction);

  await sleep(1000);
  return await interaction.followUp({
    content: t("server.you_need_refresh", { e, locale }),
    flags: [MessageFlags.Ephemeral],
  });
}