import { ButtonStyle, ModalSubmitInteraction, PermissionFlagsBits, StringSelectMenuInteraction, parseEmoji } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import modals from "../modals";
import Database from "../../database";
import payloadWelcome, { WelcomeCacheContent } from "./payload.welcome";

export default async function contentWelcome(
  interaction: StringSelectMenuInteraction<"cached"> | ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, message, member, guildId, guild } = interaction;

  if (interaction instanceof StringSelectMenuInteraction) {
    const data = await Database.getGuild(guildId);
    if (data?.WelcomeNotification?.body?.content) WelcomeCacheContent.set(member.id, data?.WelcomeNotification?.body?.content);
    return await interaction.showModal(modals.welcome.content(locale, data?.WelcomeNotification?.body?.content || ""));
  }

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  if (!message) return;
  await interaction.deferUpdate();

  const oldContent = WelcomeCacheContent.get(member.id);
  try {
    const content = interaction.fields.getTextInputValue("content")?.limit("MessageContent");
    WelcomeCacheContent.set(member.id, content);
    const payload = payloadWelcome(undefined, member);

    return await interaction.editReply({
      content: payload.content,
      embeds: [],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("welcome.components.buttons.back", locale),
              custom_id: JSON.stringify({ c: "welcome_content", uid: member.id, src: "back" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("⏮️")!,
            },
            {
              type: 2,
              label: t("keyword_save", locale),
              custom_id: JSON.stringify({ c: "welcome_content", uid: member.id, src: "save" }),
              style: ButtonStyle.Success,
              emoji: parseEmoji("💾")!,
            },
            {
              type: 2,
              label: t("welcome.components.buttons.edit", locale),
              custom_id: JSON.stringify({ c: "welcome_content", uid: member.id, src: "edit" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("📝")!,
            },
            {
              type: 2,
              label: t("welcome.components.buttons.view", locale),
              custom_id: JSON.stringify({ c: "welcome_content", uid: member.id, src: "view" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("🔎")!,
            },
            {
              type: 2,
              label: t("welcome.components.buttons.delete", locale),
              custom_id: JSON.stringify({ c: "welcome_content", uid: member.id, src: "delete" }),
              style: ButtonStyle.Danger,
              emoji: parseEmoji(e.Trash)!,
            },
          ],
        },
      ],
    });

  } catch (err) {
    if (oldContent) WelcomeCacheContent.set(member.id, oldContent);
    return await interaction.followUp({
      content: t("welcome.content.error", { e, locale, err }),
      ephemeral: true,
    });
  }

}