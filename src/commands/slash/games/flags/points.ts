import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function points(
  interaction: ChatInputCommandInteraction | Message
) {
  const { userLocale: locale } = interaction;
  const user = interaction instanceof ChatInputCommandInteraction ? interaction.user : interaction.author;

  const msg = await interaction.reply({
    content: t("quiz.count.loading", { e, locale }),
    fetchReply: true
  });

  const data = await Database.getUser(user.id);

  const payload = {
    content: t("quiz.count.points", {
      e,
      locale,
      points: data?.GamingCount?.FlagCount || 0
    })
  };

  return interaction instanceof ChatInputCommandInteraction
    ? await interaction.editReply(payload).catch(() => { })
    : await msg.edit(payload).catch(() => { });
}