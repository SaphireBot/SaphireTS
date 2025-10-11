import { APIEmbed, APIMessage, ButtonStyle, MessageFlags, ModalSubmitInteraction, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { DiscordPermissons } from "../../util/constants";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import modals from "../modals";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import handler from "../commands/handler";
import Database from "../../database";
import { LeaveCacheEmbed } from "./payload.leave";

export default async function embedLeaveLink(
  interaction: StringSelectMenuInteraction<"cached"> | ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, message, member, guildId, guild, user } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => null);
  if (!message) return;
  const primaryPayload = {
    content: message.content,
    embeds: message.embeds,
    components: message.components,
  };

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  if (!message) return;

  if (interaction instanceof StringSelectMenuInteraction)
    return await interaction.showModal(modals.leave.messageLink(locale));

  try {

    const url = interaction.fields.getTextInputValue("url");

    if (!url.isURL() || !url.startsWith("https://discord.com/channels/"))
      return await interaction.reply({
        content: t("embed.messageLink.url_invalid", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });

    const params = url.split("/");
    const channelId = params.at(-2);
    const messageId = params.at(-1);

    await interaction.deferUpdate();
    await sleep(1000);

    await interaction.editReply({ content: t("embed.messageLink.loading", { e, locale }), embeds: [], components: [] });
    const messageFetched = await client.rest.get(`/channels/${channelId}/messages/${messageId}`).catch(() => null) as APIMessage | null;
    await sleep(1500);

    if (!messageFetched)
      return await resetMessageAndReply(t("embed.messageLink.fetch_error", { e, locale }));

    if (!messageFetched.embeds?.length)
      return await resetMessageAndReply(t("embed.no_embed_found", { e, locale }));

    if (messageFetched.embeds.length > 1) {
      await sleep(1500);
      const embedCommand = handler.getCommandMention("embed") || `\`${(await Database.getPrefix({ guildId, userId: user.id })).random()}embed\``;
      return await resetMessageAndReply(t("leave.content.more_than_one_embed", { e, locale, embedCommand }));
    }

    let embed: APIEmbed | undefined = messageFetched?.embeds?.[0] || {};

    if (
      !embed.author
      && !embed.description
      && !embed.title
      && !embed.image?.url
      && !embed.footer?.text
    ) embed = undefined;

    if (!embed)
      return await resetMessageAndReply(t("embed.no_embed_found", { e, locale }));

    return await interaction.editReply({
      content: null,
      embeds: [embed],
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
    })
      .then(() => LeaveCacheEmbed.set(member.id, embed));

  } catch (err) {
    return await resetMessageAndReply(t("embed.error", { e, locale, err }).limit("MessageContent"));
  }

  async function resetMessageAndReply(content: string) {
    await interaction.editReply(primaryPayload);
    await sleep(2000);
    return await interaction.followUp({ content, flags: [MessageFlags.Ephemeral] });
  }
}