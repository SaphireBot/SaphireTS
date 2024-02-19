import { Message } from "discord.js";

export default {
  name: "pro",
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
  execute: async function (message: Message, __: string[] | undefined) {
    message.parseChannelMentions();
    console.log(message.mentions.channels);
  }
};