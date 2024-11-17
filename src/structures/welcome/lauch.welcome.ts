import { ButtonInteraction, ChatInputCommandInteraction, Message, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import lauchComponents from "./lauch.components";

export default async function lauchWelcome(
  interaction: ChatInputCommandInteraction<"cached"> | Message<true> | ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">,
  update?: "update" | "editReply" | "reply",
) {

  const { guild, member, guildId, userLocale: locale } = interaction;

  if (interaction instanceof Message)
    if (interaction.partial) await interaction.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);

  const payload = {
    content: t("welcome.content.lauch", { e, locale, member }),
    components: lauchComponents(data, member.id, locale),
    embeds: [],
  };

  if (update === "reply" && "reply" in interaction)
    // @ts-expect-error ignore
    return await interaction.reply(payload);

  if (update === "editReply" && "editReply" in interaction)
    return await interaction.editReply(payload);

  if (update === "update" && "update" in interaction)
    return await interaction.update(payload);

  if ("edit" in interaction)
    return await interaction.edit(payload);

  if ("reply" in interaction)
    return await interaction.reply(payload);
}