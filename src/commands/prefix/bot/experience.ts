import { Message } from "discord.js";
import Experience from "../../../managers/experience/experience";
import { t } from "../../../translator";
import { e } from "../../../util/json";

const aliases = [
  "erfahrung",
  "experience",
  "experiencia",
  "expérience",
  "経験",
  "experiência",
  "经验",
  "stufen",
  "levels",
  "niveles",
  "niveaux",
  "レベル",
  "níveis",
  "级别",
  "stufe",
  "level",
  "nivel",
  "niveau",
  "nível",
  "Erfahrungen",
  "experiences",
  "experiencias",
  "expériences",
  "experiências",
  "xp",
  "lvl",
];

export default {
  name: "experience",
  description: "A fast way to see informations",
  aliases,
  category: "bot",
  api_data: {
    category: "Saphire",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message, _: string[] | undefined) {

    const { userLocale: locale } = message;

    const mention = await message.parseUserMentions();
    const msg = await message.reply({ content: t("experience.loading", { e, locale }) });
    const file = await Experience.renderCard(mention.first() || message.author);
    return await msg.edit({ content: null, files: [file] })
      .catch(async () => await message.reply({ content: undefined, files: [file] }).catch(() => { }));
  },
};