import { Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";

const aliases = [
  "mögen",
  "likes",
  "megusta",
  "aimer",
  "好き",
  "gostar",
  "喜欢",
  "likes",
  "aime",
  "いいね",
  "curtidas",
  "点赞",
];

const meAliases = [
  "mich",
  "me",
  "yo",
  "moi",
  "私",
  "eu",
  "我",
  "i"
];

export default {
  name: "like",
  description: "Destribua likes",
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
  execute: async function (message: Message, args: string[] | undefined) {

    // const { author, userLocale: locale } = message;
    // const members = await message.parseUserMentions();

    // const member = members.first();

    // if (!member || member.id === author.id)
    //   return await message.reply({
    //     content: t("likes.mention_someone", { e, locale }),
    //   });

    // if (meAliases.includes((args?.[0] || "").toLowerCase())) {
    //   const data = await Database.getUser(author.id);
    //   return  
    // }
    
  },
};