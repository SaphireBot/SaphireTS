import { APIMessage, ButtonStyle, ModalSubmitInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";

export default async function messageLink(
  interaction: ModalSubmitInteraction<"cached">
) {

  const { userLocale: locale, fields, user } = interaction;

  try {

    const url = fields.getTextInputValue("link");

    if (!url.isURL() || !url.startsWith("https://discord.com/channels/"))
      return await interaction.reply({
        content: t("embed.messageLink.url_invalid", { e, locale }),
        ephemeral: true
      });

    const params = url.split("/");
    const channelId = params.at(-2);
    const messageId = params.at(-1);

    await interaction.reply({
      content: t("embed.messageLink.loading", { e, locale }),
      ephemeral: true
    });

    const message = await client.rest.get(`/channels/${channelId}/messages/${messageId}`).catch(() => null) as APIMessage | null;

    if (!message)
      return await interaction.editReply({
        content: t("embed.messageLink.fetch_error", { e, locale })
      });

    if (!message.embeds?.length)
      return await interaction.editReply({
        content: t("embed.no_embed_found", { e, locale })
      });

    for await (const embed of message.embeds)
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                emoji: "⬇️",
                label: t("embed.components.select_menu.config.options.3.label", locale),
                custom_id: JSON.stringify({ c: "embed", src: "json_down", uid: user.id }),
                style: ButtonStyle.Primary
              }
            ].asMessageComponents()
          }
        ]
      });

    return await interaction.editReply({
      content: t("embed.messageLink.loaded", { e, locale })
    });
  } catch (err) {
    return await interaction.followUp({
      content: t("embed.error", { e, locale, err }).limit("MessageContent"),
      ephemeral: true
    });
  }

}