import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, Message } from "discord.js";
import Database from "../../../database";
import reply from "./reply";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default async function status(
  interaction: ChatInputCommandInteraction | Message<true> | ButtonInteraction,
  customIdOptions?: { c: "pig", src: "refresh", uid: string }
) {

  const { userLocale: locale } = interaction;
  const { LastPrize, LastWinner, Money } = (await Database.getClientData())?.Porquinho || {};
  const user = "user" in interaction ? interaction.user : interaction.author;

  const payload = {
    embeds: [{
      color: Colors.Blue,
      title: t("pig.embed.title", { e, locale }),
      description: t("pig.embed.description", { e, locale }),
      fields: [
        {
          name: t("pig.embed.fields.0.name", { e, locale }),
          value: t("pig.embed.fields.0.value", {
            e,
            locale,
            LastPrize: LastPrize || 0,
            LastWinner: LastWinner || "---"
          }),
          inline: true
        },
        {
          name: t("pig.embed.fields.1.name", { e, locale }),
          value: t("pig.embed.fields.1.value", { e, locale, Money: Money?.currency() }),
          inline: true
        }
      ]
    }],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            emoji: "🔄",
            label: t("keyword_refresh", locale),
            custom_id: JSON.stringify({ c: "pig", src: "refresh", uid: user.id }),
            style: ButtonStyle.Primary
          }
        ]
      }
    ]
  };

  if (
    interaction instanceof ButtonInteraction
    && user.id !== customIdOptions?.uid
  )
    return await interaction.reply(payload);

  return interaction instanceof ButtonInteraction
    ? await interaction.update(payload)
    : await reply(interaction, payload);

}