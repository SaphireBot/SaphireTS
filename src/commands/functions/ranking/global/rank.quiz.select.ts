import { ChatInputCommandInteraction, Message, StringSelectMenuInteraction } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import { QuizCharactersManager } from "../../../../structures/quiz";

export default async function quizRanking(
  interactionOrMessage: ChatInputCommandInteraction | StringSelectMenuInteraction | Message,
  script: boolean,
) {

  const { userLocale: locale } = interactionOrMessage;
  const user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;

  const data = {
    content: t("quiz.ranking.choose_your_type", { e, locale }),
    components: [{
      type: 1,
      components: [{
        type: 3,
        custom_id: JSON.stringify({ c: "quiz", src: "rank", id: user.id, script }),
        placeholder: t("quiz.ranking.choose_your_type_placeholder", { e, locale }),
        options: QuizCharactersManager.categories.map(category => ({
          label: t(`quiz.ranking.options.${category}.name`, locale),
          // emoji: e.CheckV,
          description: t(`quiz.ranking.options.${category}.description`, locale),
          value: category,
        })),
      }],
    }],
  };

  if (
    interactionOrMessage instanceof ChatInputCommandInteraction
    || interactionOrMessage instanceof StringSelectMenuInteraction
  )
    return await interactionOrMessage.editReply(data);

  return await interactionOrMessage.edit(data);
}