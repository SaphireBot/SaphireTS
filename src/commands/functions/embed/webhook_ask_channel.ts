import { ButtonStyle, ChannelType, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function webhookAskChannel(interaction: StringSelectMenuInteraction<"cached">) {

  const { userLocale: locale, message, user } = interaction;
  const embed = message.embeds?.[0]?.toJSON() || {};

  if (!Object.keys(embed).length)
    return await interaction.reply({
      content: t("embed.no_embed_found", { e, locale }),
      ephemeral: true
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
            style: ButtonStyle.Primary
          }
        ]
      },
      {
        type: 1,
        components: [{
          type: 8,
          custom_id: JSON.stringify({ c: "embed", src: "webhook_channel", uid: user.id }),
          placeholder: t("embed.components.select_menu.config.choose_channel_placeholder", locale),
          channel_types: [
            ChannelType.AnnouncementThread,
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText,
            ChannelType.GuildVoice,
            ChannelType.PrivateThread,
            ChannelType.PublicThread
          ]
        }]
      }
    ]
  });
}