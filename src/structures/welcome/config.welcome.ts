import { ButtonInteraction, ChatInputCommandInteraction, Colors, Message, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import handler from "../commands/handler";
import Database from "../../database";

export default async function configWelcome(
  interaction: Message<true> | StringSelectMenuInteraction<"cached"> | ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
  buttonInteractionData?: "update" | "editReply",
) {

  const { guild, member, userLocale: locale, guildId } = interaction;

  if (interaction instanceof Message)
    if (interaction.partial) await interaction.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const embedCommand = handler.getCommandMention("embed") || "`/embed`";

  const data = await Database.getGuild(guildId);
  const hasData = (
    data?.WelcomeNotification?.body?.content?.length
    || data?.WelcomeNotification?.body?.embed
  ) ? true : false;

  const payload = {
    content: null,
    embeds: [{
      color: Colors.Blue,
      title: t("welcome.embeds.config.title", { e, locale }),
      description: t("welcome.embeds.config.description", { e, locale, member }),
      fields: [
        {
          name: t("welcome.embeds.config.fields.0.name", locale),
          value: t("welcome.embeds.config.fields.0.value", { locale, member }),
        },
        {
          name: t("welcome.embeds.config.fields.1.name", locale),
          value: t("welcome.embeds.config.fields.1.value", { locale, member, embedCommand }),
        },
        {
          name: t("welcome.embeds.config.fields.2.name", locale),
          value: t("welcome.embeds.config.fields.2.value", { locale, e }),
        },
      ],
      footer: {
        text: t("welcome.embeds.config.footer.text", locale),
      },
    }],
    components: [
      {
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "welcome", uid: member.id, src: "config" }),
          placeholder: t("welcome.components.select_menu.config.placeholder", locale),
          options: [
            {
              label: t("welcome.components.select_menu.config.options.0.label", locale),
              emoji: parseEmoji("⏮️"),
              description: t("welcome.components.select_menu.config.options.0.description", locale),
              value: "home",
            },
            {
              label: t("welcome.components.select_menu.lauch.options.0.label", locale),
              emoji: hasData ? "🔎" : e.DenyX,
              description: t(`welcome.components.select_menu.lauch.options.0.description_${hasData ? "on" : "off"}`, locale),
              value: "view",
            },
            {
              label: t("welcome.components.select_menu.config.options.1.label", locale),
              emoji: parseEmoji("📝"),
              description: t("welcome.components.select_menu.config.options.1.description", locale),
              value: "content",
            },
            {
              label: t("welcome.components.select_menu.config.options.2.label", locale),
              emoji: parseEmoji("🧾"),
              description: t("welcome.components.select_menu.config.options.2.description", locale),
              value: "textJson",
            },
            {
              label: t("welcome.components.select_menu.config.options.3.label", locale),
              emoji: parseEmoji("📂"),
              description: t("welcome.components.select_menu.config.options.3.description", locale),
              value: "embed_file",
            },
            {
              label: t("welcome.components.select_menu.config.options.4.label", locale),
              emoji: parseEmoji("🔗"),
              description: t("welcome.components.select_menu.config.options.4.description", locale),
              value: "embed_link",
            },
            {
              label: t("welcome.components.select_menu.config.options.5.label", locale),
              emoji: parseEmoji("📜"),
              description: t("welcome.components.select_menu.config.options.5.description", locale),
              value: "atual_embed",
            },
            {
              label: t("welcome.components.select_menu.config.options.6.label", locale),
              emoji: parseEmoji("🖼️"),
              description: data.WelcomeNotification?.thumbnailImage ? t("keyword_enable", locale) : t("keyword_disable", locale),
              value: "member_thumbnail",
            },
            {
              label: t("welcome.components.select_menu.config.options.7.label", locale),
              emoji: parseEmoji(e.Trash),
              description: t("welcome.components.select_menu.config.options.7.description", locale),
              value: "delete",
            },
          ],
        }],
      },
    ],
  };

  if (
    interaction instanceof Message
    || interaction instanceof ChatInputCommandInteraction
  )
    // @ts-expect-error ignore
    return await interaction.reply(payload);

  if (interaction instanceof StringSelectMenuInteraction)
    if (buttonInteractionData === "editReply")
      return await interaction.editReply(payload);
    else return await interaction.update(payload);

  if (interaction instanceof ButtonInteraction) {
    if (buttonInteractionData === "editReply") return await interaction.editReply(payload);
    if (buttonInteractionData === "update") return await interaction.update(payload);
  }
}