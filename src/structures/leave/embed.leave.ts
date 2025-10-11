import { ButtonStyle, EmbedBuilder, MessageFlags, ModalSubmitInteraction, PermissionFlagsBits, StringSelectMenuInteraction, embedLength, parseEmoji } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import modals from "../modals";
import Database from "../../database";
import payloadLeave, { LeaveCacheEmbed } from "./payload.leave";

export default async function embedLeave(
  interaction: StringSelectMenuInteraction<"cached"> | ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, message, member, guildId, guild } = interaction;

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  if (!message) return;

  if (interaction instanceof StringSelectMenuInteraction) {
    const data = await Database.getGuild(guildId);
    if (data?.LeaveNotification?.body?.embed) LeaveCacheEmbed.set(member.id, data.LeaveNotification.body.embed);
    return await interaction.showModal(modals.leave.embed(locale, JSON.stringify(data?.LeaveNotification?.body?.embed) || ""));
  }

  await interaction.deferUpdate();

  if (!(interaction instanceof ModalSubmitInteraction)) return;

  const oldEmbed = LeaveCacheEmbed.get(member.id);
  try {
    const json = interaction.fields.getTextInputValue("embed");
    const embed = new EmbedBuilder(JSON.parse(json))?.data;

    if (
      !embed.author
      && !embed.description
      && !embed.title
      && !embed.image?.url
      && !embed.footer?.text
    )
      return await interaction.followUp({
        content: t("leave.content.empty_embed", { e, locale, err: "Empty Embed Content" }),
        flags: [MessageFlags.Ephemeral],
      });

    const length = embedLength(embed);
    if (length > 6000)
      return await interaction.followUp({
        content: t("leave.content.embed_content_over_limit", { e, locale, length: length.currency() }),
        flags: [MessageFlags.Ephemeral],
      });

    LeaveCacheEmbed.set(member.id, embed);
    const payload = payloadLeave(undefined, member);

    return await interaction.editReply({
      embeds: payload.embeds,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("leave.components.buttons.back", locale),
              custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "back" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("⏮️")!,
            },
            {
              type: 2,
              label: t("keyword_save", locale),
              custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "save" }),
              style: ButtonStyle.Success,
              emoji: parseEmoji("💾")!,
            },
            {
              type: 2,
              label: t("leave.components.buttons.edit", locale),
              custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "edit" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("📝")!,
            },
            {
              type: 2,
              label: t("leave.components.buttons.view", locale),
              custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "view" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji(e.mag)!,
            },
            {
              type: 2,
              label: t("leave.components.buttons.delete", locale),
              custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "delete" }),
              style: ButtonStyle.Danger,
              emoji: parseEmoji(e.Trash)!,
            },
          ],
        },
      ],
    });

  } catch (err) {
    if (oldEmbed) LeaveCacheEmbed.set(member.id, oldEmbed);
    return await interaction.followUp({
      content: t("leave.content.empty_embed", { e, locale, err }),
      flags: [MessageFlags.Ephemeral],
    });
  }

}