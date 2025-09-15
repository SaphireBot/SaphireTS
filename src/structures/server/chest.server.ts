import { MessageFlags, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import payloadServer from "./payload.server";
import { MysticalTravelingChestManager } from "../../managers";

export default async function chestServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, guildId, message } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageGuild, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageGuild], "Discord_client_need_some_permissions");

  const data = await MysticalTravelingChestManager.toggle(guildId);

  // if ((data as any)?.err)
  //   return await interaction.update({
  //     content: t("twitch.error", { e, locale, err: data?.err }),
  //     embeds: [],
  //     components: [],
  //   });

  await interaction.update(await payloadServer(data, locale, guild, member));
  await sleep(1500);
  return await interaction.followUp({
    content: t("server.isnt_ready_yet_chest", { e, locale }),
    flags: [MessageFlags.Ephemeral],
  });
}