import { ButtonStyle, ChannelType, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function channelWelcome(
  interaction: StringSelectMenuInteraction<"cached">,
) {

  const { guild, member, userLocale: locale, guildId, user } = interaction;

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  const data = (await Database.getGuild(guildId))?.WelcomeNotification;
  const channel = data?.channelId ? await guild.channels.fetch(data.channelId).catch(() => undefined) : undefined;

  const content = data?.body?.content;
  let embed = data?.body?.embed;

  if (
    !embed?.author
    && !embed?.description
    && !embed?.title
    && !embed?.image?.url
    && !embed?.footer?.text
  ) embed = undefined;

  return await interaction.update({
    content: t("welcome.content.choose_channel", { e, locale, channel: channel || t("welcome.content.no_channel", locale) }),
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("welcome.components.buttons.back", locale),
            custom_id: JSON.stringify({ c: "welcome_channel", uid: member.id, src: "back" }),
            style: ButtonStyle.Primary,
            emoji: parseEmoji("⏮️")!,
          },
          {
            type: 2,
            label: t("welcome.components.buttons.send", locale),
            custom_id: JSON.stringify({ c: "welcome_channel", uid: member.id, src: "send" }),
            style: ButtonStyle.Primary,
            emoji: parseEmoji("📨")!,
            disabled: (channel && (content || embed)) ? false : true,
          },
          {
            type: 2,
            label: t("welcome.components.buttons.delete", locale),
            custom_id: JSON.stringify({ c: "welcome_channel", uid: member.id, src: "delete" }),
            style: ButtonStyle.Danger,
            emoji: parseEmoji(e.Trash)!,
            disabled: channel ? false : true,
          },
        ],
      },
      {
        type: 1,
        components: [{
          type: 8,
          custom_id: JSON.stringify({ c: "welcome", src: "channel", uid: user.id }),
          placeholder: t("embed.components.select_menu.config.choose_channel_placeholder", locale),
          channel_types: [
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText,
          ],
        }],
      },
    ],
  });
}