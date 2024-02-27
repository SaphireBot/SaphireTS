import { Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Gemini from "../../../structures/gemini/gemini";

export default {
  name: "saphire",
  description: "Gemini command",
  aliases: ["s"],
  category: "others",
  api_data: {
    category: "Outros",
    synonyms: ["s"],
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    if (!args?.length)
      return await message.reply({
        content: t("gemini.no_prompt", { e, locale: message.userLocale })
      });

    return await Gemini.execute(message, args.join(" "));
  }
};