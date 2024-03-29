import { Message } from "discord.js";
import FlagQuiz, { allFlags } from "../../../structures/quiz/flags";
import { t } from "../../../translator";
import { e } from "../../../util/json";
const flags = ["flagge", "flag", "bandera", "drapeau", "旗", "bandeira", "国旗", "f", "b", "d"];

export default {
  name: "quiz",
  description: "comando teste do quiz",
  aliases: ["q"],
  category: "games",
  api_data: {
    category: "Jogos",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { userLocale: locale, author } = message;

    if (!args) args = [] as string[];

    if (flags.includes(args[0]?.toLowerCase()))
      return await new FlagQuiz(message).checkIfChannelIsUsed();

    return await message.reply({
      content: t("quiz.prefix.content", { e, locale }),
      components: [{
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "quiz", uid: author.id }),
          placeholder: t("quiz.prefix.select.placeholder", locale),
          options: [
            {
              label: t("quiz.prefix.select.options.0.label", locale),
              emoji: "🌍",
              description: t("quiz.prefix.select.options.0.description", { locale, flags: allFlags.length }),
              value: "flags",
            }
          ]
        }]
      }].asMessageComponents()
    });

  }
};