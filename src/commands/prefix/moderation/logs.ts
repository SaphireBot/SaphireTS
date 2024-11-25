import { Message } from "discord.js";
import logSystemServer from "../../../structures/server/logsystem.server";

export default {
  name: "logs",
  description: "",
  aliases: [],
  category: "moderation",
  api_data: {
    category: "",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {
    return await logSystemServer(message);
  },
};