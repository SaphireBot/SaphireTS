import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../../database";
import reply from "./reply";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";

export default async function broke(
  interaction: ChatInputCommandInteraction | Message<true>,
) {

  const { userLocale: locale } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;

  const pig = (await Database.getClientData())?.Porquinho || {};
  const money = pig.Money || 0;

  await Database.editBalance(
    user.id,
    {
      createdAt: new Date(),
      keywordTranslate: "pig.transactions.win",
      method: "add",
      mode: "pig",
      type: "gain",
      value: money,
    },
  );

  await Database.Client.updateOne(
    { id: client.user!.id },
    {
      $set: {
        Porquinho: {
          LastPrize: money,
          LastWinner: `${user.username} - \`${user.id}\``,
          Money: 0,
        },
      },
    },
  );

  return await reply(interaction, {
    content: t("pig.win", { e, locale, money: money.currency(), user }),
  });
}