import { Message } from "discord.js";

export default {
  name: "test",
  description: "nothing",
  aliases: [],
  category: "admin",
  api_data: {
    category: "",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (_: Message, __: string[] | undefined) {

  }
};