import { ButtonInteraction, ChatInputCommandInteraction, Message, MessageFlags, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import Database from "../../database";
import { t } from "../../translator/src";
import { e } from "../../util/json";
import lauchComponents from "./lauch.components";

export default async function active_switchWelcome(
  interaction: Message<true> | ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">,
) {

  const { guild, member, guildId, userLocale: locale } = interaction;

  if (interaction instanceof Message)
    if (interaction.partial) await interaction.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  const active = !(data.WelcomeNotification?.active || false);
  const content = data.WelcomeNotification?.body?.content;
  let embed = data.WelcomeNotification?.body?.embed || {};

  if (
    !embed.author
    && !embed.description
    && !embed.title
    && !embed.image?.url
    && !embed.footer?.text
  ) embed = undefined;

  if (
    active
    && !content
    && !embed
  )
    // @ts-expect-error ignore
    return await interaction.reply({
      content: t("welcome.content.cant_active", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const response = await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { $set: { "WelcomeNotification.active": active } },
    { upsert: true, new: true },
  );

  const payload = {
    content: t("welcome.content.lauch", { e, locale, member }),
    components: lauchComponents(response, member.id, locale),
    embeds: [],
  };

  if (
    interaction instanceof Message
    || interaction instanceof ChatInputCommandInteraction
  )
    return await interaction.reply(payload);

  if (
    interaction instanceof ButtonInteraction
    || interaction instanceof StringSelectMenuInteraction
  ) return await interaction.update(payload);
}