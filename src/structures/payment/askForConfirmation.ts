import { ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import Database from "../../database";
import { loginRequired } from "./";

export default async function askForConfirmation(interaction: Message<true> | ChatInputCommandInteraction<"cached">) {

  const { userLocale: locale, member } = interaction;

  const data = await Database.getUser(member!.id);
  if (!data!.email?.length)
    return await loginRequired(interaction);

  return await interaction.reply({
    content: t("mercadopago.confirm_before_generate", { e, locale, client }),
    fetchReply: true,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("mercadopago.confirm", locale),
            emoji: e.CheckV.emoji(),
            custom_id: JSON.stringify({ c: "mpg", src: "generate_key", id: member!.id }),
            style: ButtonStyle.Success
          },
          {
            type: 2,
            label: t("mercadopago.cancel", locale),
            emoji: e.DenyX.emoji(),
            custom_id: JSON.stringify({ c: "mpg", src: "cancel", id: member!.id }),
            style: ButtonStyle.Danger
          }
        ]
      }
    ]
  });

}