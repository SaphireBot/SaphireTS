import { ButtonStyle, ChannelType, MessageFlags, parseEmoji, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import active_switchWelcome from "./active_switch.welcome";
import viewWelcome from "./view.welcome";
import configWelcome from "./config.welcome";
import lauchWelcome from "./lauch.welcome";
import contentWelcome from "./content.welcome";
import embedWelcome from "./embed.welcome";
import channelWelcome from "./channel.welcome";
import Database from "../../database";
import embedWelcomeLink from "./embedLink.welcome";
import embedWelcomeAtual from "./embedAtual.welcome";
import embedWelcomeFile from "./embedFile.welcome";
import memberThumbnailWelcome from "./memberThumbnail.welcome";

type valueType = "active_switch" | "view" | "delete" | "config" | "home" | "content" | "textJson" | "embed_file" | "member_thumbnail";
export default async function selectMenuWelcome(
  interaction: StringSelectMenuInteraction<"cached">,
  customData: { c: "welcome", uid: string, src: "lauch" | "channel" },
) {

  const { user, userLocale: locale, values, message, guildId } = interaction;

  if (user.id !== customData?.uid)
    return await interaction.reply({
      content: t("glass.dont_click_here", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const value = values[0] as valueType;

  if (customData?.src === "channel") {
    const data = await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $set: { "WelcomeNotification.channelId": value } },
      { upsert: true, new: true },
    );

    const content = data.WelcomeNotification?.body?.content;
    let embed = data.WelcomeNotification?.body?.embed || {};

    if (
      !embed.author
      && !embed.description
      && !embed.title
      && !embed.image?.url
      && !embed.footer?.text
    ) embed = undefined;

    return await interaction.update({
      content: t("welcome.content.choose_channel", { e, locale, channel: `<#${value}>` }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("welcome.components.buttons.back", locale),
              custom_id: JSON.stringify({ c: "welcome_channel", uid: user.id, src: "back" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("⏮️")!,
            },
            {
              type: 2,
              label: t("welcome.components.buttons.send", locale),
              custom_id: JSON.stringify({ c: "welcome_channel", uid: user.id, src: "send" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("📨")!,
              disabled: (content || embed) ? false : true,
            },
            {
              type: 2,
              label: t("welcome.components.buttons.delete", locale),
              custom_id: JSON.stringify({ c: "welcome_channel", uid: user.id, src: "delete" }),
              style: ButtonStyle.Danger,
              emoji: parseEmoji(e.Trash)!,
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

  if (value === "home")
    return await lauchWelcome(interaction, "update");

  const func = {
    home: () => { },
    active_switch: active_switchWelcome,
    view: viewWelcome,
    config: configWelcome,
    content: contentWelcome,
    textJson: embedWelcome,
    config_channel: channelWelcome,
    embed_link: embedWelcomeLink,
    atual_embed: embedWelcomeAtual,
    embed_file: embedWelcomeFile,
    member_thumbnail: memberThumbnailWelcome,
    delete: async () => message.delete()?.catch(() => { }),
  }[value as valueType];

  if (func) return await func(interaction);

  return await interaction.reply({
    content: "#das416d4sad68a4d6sa4d6sa84da68d4s54das",
    flags: [MessageFlags.Ephemeral],
  });
}