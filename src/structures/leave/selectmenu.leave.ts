import { ButtonStyle, ChannelType, parseEmoji, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import active_switchLeave from "./active_switch.leave";
import viewLeave from "./view.leave";
import configLeave from "./config.leave";
import lauchLeave from "./lauch.leave";
import contentLeave from "./content.leave";
import embedLeave from "./embed.leave";
import channelLeave from "./channel.leave";
import Database from "../../database";
import embedLeaveLink from "./embedLink.leave";
import embedLeaveAtual from "./embedAtual.leave";
import embedLeaveFile from "./embedFile.leave";

type valueType = "active_switch" | "view" | "delete" | "config" | "home" | "content" | "textJson" | "embed_file";
export default async function selectMenuLeave(
  interaction: StringSelectMenuInteraction<"cached">,
  customData: { c: "leave", uid: string, src: "lauch" | "channel" },
) {

  const { user, userLocale: locale, values, message, guildId } = interaction;

  if (user.id !== customData?.uid)
    return await interaction.reply({
      content: t("glass.dont_click_here", { e, locale }),
      ephemeral: true,
    });

  const value = values[0] as valueType;

  if (customData?.src === "channel") {
    const data = await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $set: { "LeaveNotification.channelId": value } },
      { upsert: true, new: true },
    );

    const content = data.LeaveNotification?.body?.content;
    let embed = data.LeaveNotification?.body?.embed || {};

    if (
      !embed.author
      && !embed.description
      && !embed.title
      && !embed.image?.url
      && !embed.footer?.text
    ) embed = undefined;

    return await interaction.update({
      content: t("leave.content.choose_channel", { e, locale, channel: `<#${value}>` }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("leave.components.buttons.back", locale),
              custom_id: JSON.stringify({ c: "leave_channel", uid: user.id, src: "back" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("⏮️")!,
            },
            {
              type: 2,
              label: t("leave.components.buttons.send", locale),
              custom_id: JSON.stringify({ c: "leave_channel", uid: user.id, src: "send" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("📨")!,
              disabled: (content || embed) ? false : true,
            },
            {
              type: 2,
              label: t("leave.components.buttons.delete", locale),
              custom_id: JSON.stringify({ c: "leave_channel", uid: user.id, src: "delete" }),
              style: ButtonStyle.Danger,
              emoji: parseEmoji(e.Trash)!,
            },
          ],
        },
        {
          type: 1,
          components: [{
            type: 8,
            custom_id: JSON.stringify({ c: "leave", src: "channel", uid: user.id }),
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
    return await lauchLeave(interaction, "update");

  const func = {
    home: () => { },
    active_switch: active_switchLeave,
    view: viewLeave,
    config: configLeave,
    content: contentLeave,
    textJson: embedLeave,
    config_channel: channelLeave,
    embed_link: embedLeaveLink,
    atual_embed: embedLeaveAtual,
    embed_file: embedLeaveFile,
    delete: async () => message.delete()?.catch(() => { }),
  }[value as valueType];

  if (func) return await func(interaction);

  return await interaction.reply({
    content: "#das416d4sad68a4d6sa4d6sa84da68d4s54das",
    ephemeral: true,
  });
}