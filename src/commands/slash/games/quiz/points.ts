import { ChatInputCommandInteraction } from "discord.js";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function points(
  interaction: ChatInputCommandInteraction,
  type: "flags" | "brands"
) {
  const { userLocale: locale, user } = interaction;

  const msg = await interaction.reply({
    content: t("quiz.flags.count.loading", { e, locale }),
    fetchReply: true
  });

  const data = await Database.getUser(user.id);

  const payload = {
    content: t(`quiz.${type}.count.points`, {
      e,
      locale,
      points: data?.GamingCount?.[type === "flags" ? "FlagCount" : "Logomarca"] || 0
    })
  };

  return interaction instanceof ChatInputCommandInteraction
    ? await interaction.editReply(payload).catch(() => { })
    : await msg.edit(payload).catch(() => { });
}