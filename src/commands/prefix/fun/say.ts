import { Message } from "discord.js";
import handler from "../../../structures/commands/handler";

export default {
  name: "say",
  description: "Say command",
  aliases: [],
  category: "fun",
  api_data: {
    category: "Diversão",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    return await message.reply({
      content: handler.getCommandMention("say") || "`/say`",
    })
      .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
  },
};