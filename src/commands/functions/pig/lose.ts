import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../../database";
import reply from "./reply";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function lose(
  interaction: ChatInputCommandInteraction | Message<true>
) {

  const { userLocale: locale } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;

  await Database.editBalance(
    user.id,
    {
      createdAt: new Date(),
      keywordTranslate: "pig.transactions.lose",
      method: "sub",
      mode: "pig",
      type: "loss",
      value: 1000
    }
  );

  return await reply(interaction, {
    content: t("pig.lose", { e, locale })
  });
}