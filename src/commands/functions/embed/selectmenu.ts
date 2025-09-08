import { AttachmentBuilder, ButtonStyle, ChannelType, Colors, PermissionFlagsBits, ChannelSelectMenuInteraction, StringSelectMenuInteraction, MessageFlags } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import modals from "../../../structures/modals";
import payload, { payloadEmbedsColors } from "./payload";
import send from "./send";
import webhookAskChannel from "./webhook_ask_channel";
import webhookConfig from "./webhook_config";
import { PermissionsTranslate } from "../../../util/constants";
const colors = Object.entries(Colors);

export default async function selectmenu(
  interaction: StringSelectMenuInteraction<"cached"> | ChannelSelectMenuInteraction<"cached">,
  data: {
    c: "embed",
    src: "fields" | "options" | "color_pick" | "send_channel" | "webhook_channel",
    uid: string
  },
) {

  const { userLocale: locale, message, user, values, guild } = interaction;
  const embed = message.embeds?.[0]?.toJSON() || {};

  if (!data || !data?.uid || data.uid !== user.id)
    return await interaction.reply({
      content: t("embed.you_cannot_click_here", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const value = values[0];
  const numberValue = Number(value);

  if (value === "delete")
    return await message.delete().catch(() => { });

  if (data?.src === "color_pick") {

    if (value === "add_color") {
      await interaction.showModal(modals.embedGenerator.color({ locale, color: `${embed.color}` }));
      return await message.edit({ components: message.components });
    }

    embed.color = numberValue;
    payloadEmbedsColors[message.id] = numberValue;

    return await interaction.update(payload(locale, user.id, message.id, embed, message.components as any));
  }

  if (
    numberValue >= 0
    && numberValue <= 25
    && embed.fields?.[numberValue]
  ) {
    const field = embed.fields?.[numberValue];

    if (!field?.name || !field?.value)
      return await interaction.update(payload(locale, user.id, message.id, embed));

    return await interaction.showModal(
      modals.embedGenerator.fieldsEdit(
        locale,
        field.name,
        field.value,
        field.inline || false,
        value,
      ),
    );
  }

  if (data?.src === "send_channel")
    return await send(interaction as ChannelSelectMenuInteraction<"cached">);

  if (data?.src === "webhook_channel")
    return await webhookConfig(interaction as ChannelSelectMenuInteraction<"cached">);

  if (value === "json_up") {
    return await interaction.update({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("embed.components.json_up.0", locale),
              emoji: "⬅️".emoji(),
              custom_id: JSON.stringify({ c: "embed", src: "back", uid: user.id }),
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("embed.components.json_up.1", locale),
              emoji: "📝".emoji(),
              custom_id: JSON.stringify({ c: "embed", src: "json_up_text", uid: user.id }),
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: t("embed.components.json_up.2", locale),
              emoji: "📂".emoji(),
              custom_id: JSON.stringify({ c: "embed", src: "json_up_file", uid: user.id }),
              style: ButtonStyle.Primary,
            },
          ],
        },
      ],
    });
  }

  if (value === "json_down") {

    if (guild && !guild.members.me!.permissions.has(PermissionFlagsBits.AttachFiles))
      return await interaction.reply({
        content: t("embed.no_attach_files_permission", { e, locale, perm: PermissionsTranslate.AttachFiles }),
        flags: [MessageFlags.Ephemeral],
      });

    if (!Object.keys(embed).length)
      return await interaction.reply({
        content: t("embed.no_embed_found", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });

    await interaction.update({ components: message.components });

    const attach = new AttachmentBuilder(
      Buffer.from(
        JSON.stringify(embed, undefined, 2),
        "utf-8",
      ),
      { name: "embed.json" },
    );

    return await interaction.followUp({
      files: [attach],
      flags: [MessageFlags.Ephemeral],
    });
  }

  if (value === "message_link") {
    await interaction.showModal(
      modals.embedGenerator.messageLink(locale),
    );
    return await message.edit({ components: message.components });
  }

  if (value === "color")
    return await interaction.update({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("embed.components.json_up.0", locale),
              emoji: "⬅️".emoji(),
              custom_id: JSON.stringify({ c: "embed", src: "back", uid: user.id }),
              style: ButtonStyle.Primary,
            },
            {
              type: 2,
              label: "Image Color Picker",
              emoji: "🖌️".emoji(),
              url: "https://www.google.com/search?q=color+picker",
              style: ButtonStyle.Link,
            },
          ],
        },
        {
          type: 1,
          components: [{
            type: 3,
            custom_id: JSON.stringify({ c: "embed", src: "color_pick", uid: user.id }),
            placeholder: t("embed.components.select_menu.color.placeholder", locale),
            options: [
              {
                label: t("embed.components.select_menu.color.add_color.label", locale),
                description: t("embed.components.select_menu.color.add_color.description", locale),
                emoji: "🖌️",
                value: "add_color",
              },
              ...colors
                .map(([name, color]) => ({
                  label: t(`Discord.Color.${name}`, locale),
                  emoji: "🖌️",
                  value: color.toString(),
                }))
                .slice(0, 24),
            ],
          }],
        },
      ].asMessageComponents(),
    });

  if (value === "webhook")
    return await webhookAskChannel(interaction as StringSelectMenuInteraction<"cached">);

  if (value === "choose_channel") {

    if (!Object.keys(embed).length)
      return await interaction.reply({
        content: t("embed.no_embed_found", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });

    return await interaction.update({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("embed.components.json_up.0", locale),
              emoji: "⬅️".emoji(),
              custom_id: JSON.stringify({ c: "embed", src: "back", uid: user.id }),
              style: ButtonStyle.Primary,
            },
          ],
        },
        {
          type: 1,
          components: [{
            type: 8,
            custom_id: JSON.stringify({ c: "embed", src: "send_channel", uid: user.id }),
            placeholder: t("embed.components.select_menu.config.choose_channel_placeholder", locale),
            channel_types: [
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
              ChannelType.GuildText,
              ChannelType.GuildVoice,
              ChannelType.PrivateThread,
              ChannelType.PublicThread,
            ],
          }],
        },
      ],
    });
  }

}
