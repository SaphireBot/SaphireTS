import { Message } from "discord.js";
import Stop from "../../../structures/stop/stop";

export default {
  name: "stop",
  description: "[jogo] Jogue o famoso stop/adedonha direto no servidor",
  aliases: ["adedanha", "adedonha", "st"],
  category: "games",
  api_data: {
    category: "Diversão",
    synonyms: ["adedanha", "adedonha", "st"],
    tags: [],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {
    return await new Stop(message).start();
  },
};