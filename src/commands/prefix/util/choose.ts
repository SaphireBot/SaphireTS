import { Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";

const aliases = [
  "wählen",
  "elegir",
  "choisir",
  "選ぶ",
  "escolher",
  "escolhe",
  "选择",
];

export default {
  name: "choose",
  description: "Use esse comando separado por vírgulas para que eu escolha algo pra você",
  aliases,
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message, args: string[] | undefined) {

    const { userLocale: locale, content } = message;

    if (!args?.length || !content?.length)
      return await message.reply({
        content: t("choose.no_args", { e, locale }),
      });

    const chooses = args.join(" ").split(",").filter(i => i.length);
    console.log(chooses);

    if (chooses.length === 1)
      return await message.reply({
        content: t("choose.only_one_option_given", { e, locale }),
      });

    return await message.reply({
      content: t("choose.choosed", {
        e, locale,
        choose: chooses.random().trim(),
      }).limit("MessageContent"),
    });

  },
};