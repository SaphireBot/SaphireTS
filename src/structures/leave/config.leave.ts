import { ButtonInteraction, ChatInputCommandInteraction, Colors, Message, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import handler from "../commands/handler";
import Database from "../../database";

export default async function configLeave(
  interaction: Message<true> | StringSelectMenuInteraction<"cached"> | ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
  editMethod?: "update" | "editReply",
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
    data?.LeaveNotification?.body?.content?.length
    || data?.LeaveNotification?.body?.embed
  ) ? true : false;

  const payload = {
    content: null,
    embeds: [{
      color: Colors.Blue,
      title: t("leave.embeds.config.title", { e, locale }),
      description: t("leave.embeds.config.description", { e, locale, member }),
      fields: [
        {
          name: t("leave.embeds.config.fields.0.name", locale),
          value: t("leave.embeds.config.fields.0.value", { locale, member }),
        },
        {
          name: t("leave.embeds.config.fields.1.name", locale),
          value: t("leave.embeds.config.fields.1.value", { locale, member, embedCommand }),
        },
        {
          name: t("leave.embeds.config.fields.2.name", locale),
          value: t("leave.embeds.config.fields.2.value", { locale, e }),
        },
      ],
      footer: {
        text: t("leave.embeds.config.footer.text", locale),
      },
    }],
    components: [
      {
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "leave", uid: member.id, src: "config" }),
          placeholder: t("leave.components.select_menu.config.placeholder", locale),
          options: [
            {
              label: t("leave.components.select_menu.config.options.0.label", locale),
              emoji: parseEmoji("⏮️"),
              description: t("leave.components.select_menu.config.options.0.description", locale),
              value: "home",
            },
            {
              label: t("leave.components.select_menu.lauch.options.0.label", locale),
              emoji: hasData ? e.mag : e.DenyX,
              description: t(`leave.components.select_menu.lauch.options.0.description_${hasData ? "on" : "off"}`, locale),
              value: "view",
            },
            {
              label: t("leave.components.select_menu.config.options.1.label", locale),
              emoji: parseEmoji("📝"),
              description: t("leave.components.select_menu.config.options.1.description", locale),
              value: "content",
            },
            {
              label: t("leave.components.select_menu.config.options.2.label", locale),
              emoji: parseEmoji("🧾"),
              description: t("leave.components.select_menu.config.options.2.description", locale),
              value: "textJson",
            },
            {
              label: t("leave.components.select_menu.config.options.3.label", locale),
              emoji: parseEmoji("📂"),
              description: t("leave.components.select_menu.config.options.3.description", locale),
              value: "embed_file",
            },
            {
              label: t("leave.components.select_menu.config.options.4.label", locale),
              emoji: parseEmoji("🔗"),
              description: t("leave.components.select_menu.config.options.4.description", locale),
              value: "embed_link",
            },
            {
              label: t("leave.components.select_menu.config.options.5.label", locale),
              emoji: parseEmoji("📜"),
              description: t("leave.components.select_menu.config.options.5.description", locale),
              value: "atual_embed",
            },
            {
              label: t("welcome.components.select_menu.config.options.6.label", locale),
              emoji: parseEmoji("🖼️"),
              description: data.LeaveNotification?.thumbnailImage ? t("keyword_enable", locale) : t("keyword_disable", locale),
              value: "member_thumbnail",
            },
            {
              label: t("leave.components.select_menu.config.options.6.label", locale),
              emoji: parseEmoji(e.Trash),
              description: t("leave.components.select_menu.config.options.6.description", locale),
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
    return await interaction.reply(payload as any);

  if (editMethod)
      return await interaction[editMethod || "update"](payload);
}