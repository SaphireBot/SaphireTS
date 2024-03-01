import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Message, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function loginRequired(
  interaction: ButtonInteraction<"cached">
    | Message<true>
    | ChatInputCommandInteraction<"cached">
    | StringSelectMenuInteraction<"cached">
) {

  const { userLocale: locale, member } = interaction;

  const data: any = {
    content: t("mercadopago.login_required", { e, locale }),
    embeds: [],
    attachments: [],
    files: [],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("mercadopago.components.login", locale),
            url: "https://discord.com/oauth2/authorize?client_id=912509487984812043&redirect_uri=https%3A%2F%2Fsaphire.one%2Fredirect&response_type=token&scope=guilds%20email%20identify",
            style: ButtonStyle.Link
          },
          {
            type: 2,
            label: t("mercadopago.components.retry", locale),
            emoji: e.CheckV.emoji(),
            custom_id: JSON.stringify({ c: "mpg", src: "retry", id: member!.id }),
            style: ButtonStyle.Success
          }
        ]
      }
    ]
  };

  if (
    interaction instanceof ButtonInteraction
    || interaction instanceof StringSelectMenuInteraction
  )
    return interaction.replied || interaction.deferred
      ? await interaction.editReply(data)
      : await interaction.update(data);

  if (
    interaction instanceof ChatInputCommandInteraction
  )
    return interaction.replied || interaction.deferred
      ? await interaction.editReply(data)
      : await interaction.reply(data);

  if (
    interaction instanceof Message
  )
    return await interaction.reply(data);

}