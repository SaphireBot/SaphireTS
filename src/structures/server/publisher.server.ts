import { MessageFlags, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import payloadServer from "./payload.server";

export default async function publisher(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, guildId, message } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);

  const guildData = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { AutoPublisher: !data.AutoPublisher },
    { upsert: true, new: true },
  );

  if ((guildData as any)?.err)
    return await interaction.update({
      content: t("twitch.error", { e, locale, err: (guildData as any)?.err }),
      embeds: [],
      components: [],
    });

  await interaction.update(await payloadServer(guildData, locale, guild, member));
  await sleep(1500);
  return await interaction.followUp({
    content: t("server.isnt_ready_yet", { e, locale }),
    flags: [MessageFlags.Ephemeral],
  });
}