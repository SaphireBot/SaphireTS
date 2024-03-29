import { StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import FlagQuiz from "../../../structures/quiz/flags";

export default async function redirect(
  interaction: StringSelectMenuInteraction<"cached">,
  data?: { c: "quiz", uid: string }
) {

  if (!data) return;

  const { userLocale: locale, user } = interaction;

  if (data.uid !== user.id)
    return await interaction.reply({
      content: t("quiz.prefix.you_cannot_click_here", { e, locale }),
      ephemeral: true
    });

  const value = interaction.values[0] as "flags";

  if (value === "flags")
    return await new FlagQuiz(interaction).checkIfChannelIsUsed();
}