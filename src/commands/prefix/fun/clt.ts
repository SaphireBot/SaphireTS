import { Message } from "discord.js";
import { e } from "../../../util/json";

export default {
  name: "clt",
  description: "clt",
  aliases: [],
  category: "",
  api_data: {
    category: "",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message, _: string[]) {
    return await message.reply({
      content: `🚫 | Comando proibido em 189 países.\n||${e.Animated.SaphireSleeping} | Não desejo esse mal para ninguém.||`,
    });
  },
};