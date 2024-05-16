import { Message } from "discord.js";
import FastClick from "../../../structures/fastclick/fastclick";

export default {
  name: "fastclick",
  description: "Clique mais rápido que todo mundo",
  aliases: ["fc", "cr", "cliquerapido"],
  category: "games",
  api_data: {
    category: "Jogos",
    synonyms: ["fc", "cr", "cliquerapido"],
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message<true>, args: string[]) => new FastClick(message, args)
};