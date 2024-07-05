import { Message } from "discord.js";
import cooldown from "../../functions/cooldown/cooldown";

export default {
  name: "cooldown",
  description: "See your cooldown",
  aliases: ["cd"],
  category: "bot",
  api_data: {
    category: "Saphire",
    synonyms: ["cd"],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message, _: string[] | undefined) => await cooldown(message, message.author)
};