import { Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { BrandQuiz, FlagQuiz, allFlags, allBrands } from "../../../structures/quiz";

const translates = {
  flags: ["flagge", "flag", "bandera", "drapeau", "旗", "bandeira", "国旗", "f", "b", "d"],
  brands: ["marken", "brands", "marcas", "marques", "ブランド", "品牌", "m"]
};

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

    if (translates.flags.includes(args[0]?.toLowerCase()))
      return await new FlagQuiz(message).checkIfChannelIsUsed();

    if (translates.brands.includes(args[0]?.toLowerCase()))
      return await new BrandQuiz(message).checkIfChannelIsUsed();

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
            },
            {
              label: t("quiz.prefix.select.options.1.label", locale),
              emoji: "📑",
              description: t("quiz.prefix.select.options.1.description", { locale, brands: allBrands.length }),
              value: "brands",
            }
          ]
        }]
      }].asMessageComponents()
    });

  }
};