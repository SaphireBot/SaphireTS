import { ChatInputCommandInteraction, Message, time } from "discord.js";
import { statusWordTranslations } from "../../../util/constants";
import status from "./status";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import client from "../../../saphire";
import broke from "./broke";
import lose from "./lose";
import reply from "./reply";

export default async function pig(
  interaction: ChatInputCommandInteraction | Message<true>,
  args?: string[],
) {

  const { userLocale: locale } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;

  if (interaction instanceof ChatInputCommandInteraction)
    await interaction.deferReply();

  const statusRequired = interaction instanceof ChatInputCommandInteraction
    ? interaction.options.getString("options") === "status"
    : args!.some(str => statusWordTranslations.includes(str.toLowerCase()));

  if (statusRequired) return await status(interaction);

  const data = await Database.getUser(user.id);

  if ((data?.Timeouts?.Porquinho || 0) >= Date.now())
    return await reply(interaction, {
      content: t("pig.timeout", {
        locale,
        time: time(new Date(data?.Timeouts?.Porquinho || 0), "R"),
      }),
    });

  if ((data.Balance || 0) < 1000) {
    const msg = await reply(interaction, {
      content: t("pig.no_money", { e, locale }),
    });
    if (msg) await msg.react(e.Pig).catch(() => { });
    return;
  }

  await Database.Client.updateOne(
    { id: client.user!.id },
    { $inc: { "Porquinho.Money": 1000 } },
  );

  await Database.Users.updateOne(
    { id: user.id },
    { $set: { "Timeouts.Porquinho": Date.now() + (1000 * 30) } },
  );

  return Math.floor(Math.random() * 100) === 1 ? await broke(interaction) : await lose(interaction);

}