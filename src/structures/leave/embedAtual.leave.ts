import { ButtonStyle, EmbedBuilder, embedLength, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import payloadLeave, { LeaveCacheEmbed } from "./payload.leave";

export default async function embedLeaveAtual(interaction: StringSelectMenuInteraction<"cached">) {

  const { guild, member, userLocale: locale, guildId, message, channel } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const data = await Database.getGuild(guildId);
  const embed = new EmbedBuilder(data?.LeaveNotification?.body?.embed || {}).data;

  if (
    !embed?.author
    && !embed?.description
    && !embed?.title
    && !embed?.image?.url
    && !embed?.footer?.text
  )
    return await interaction.reply({
      content: t("discord.no_embeds_created", { e, locale }),
      ephemeral: true,
    });

  const length = embedLength(embed);
  if (length > 6000)
    return await interaction.followUp({
      content: t("leave.content.embed_content_over_limit", { e, locale, length: length.currency() }),
      ephemeral: true,
    });

  const payload = payloadLeave(data, member);

  if (!payload.embeds?.length)
    return await interaction.reply({
      content: t("discord.no_embeds_created", { e, locale }),
      ephemeral: true,
    });

  return await interaction.update({
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
            emoji: parseEmoji("🔎")!,
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
  })
    .then(() => LeaveCacheEmbed.set(member.id, embed))
    .catch(async err => {
      if (channel && ("send" in channel))
        return await channel.send({ content: t("twitch.error", { e, locale, err }) });
      return;
    });
}