import { Message } from "discord.js";
import lauch from "../../functions/help/lauch";
const aliases = ["hilfe", "help", "ayuda", "aide", "助ける", "ajuda", "帮助"];

export default {
  name: "help",
  description: "Um simples comando de ajuda",
  aliases,
  category: "bot",
  api_data: {
    category: "Saphire",
    synonyms: aliases,
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message, args: string[] | undefined) => await lauch(message, args)
};