import { Message } from "discord.js";

export default {
  name: "test",
  description: "nothing",
  aliases: [],
  category: "admin",
  api_data: {
    category: "admin",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (_: Message<true>, __: string[] | undefined) { }
};