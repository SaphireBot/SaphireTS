import { Message } from "discord.js";
import pig from "../../functions/pig/pig";
const aliases = [
  "pig", "schwein", "cerdo", "豚", "猪",
  "schweinchen", "cerdito", "子豚", "小猪",
  "porco", "porquinho"
];

export default {
  name: "piggy",
  description: "Good luck with the piggy",
  aliases,
  category: "economy",
  api_data: {
    category: "Economia",
    synonyms: aliases,
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message<true>, args: string[] | undefined) => await pig(message, args)
};