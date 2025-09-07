import { Message } from "discord.js";
import lottoPainel from "../../functions/lotto/painel.container";

export default {
  name: "lotto",
  description: "Adivinhe o número e ganhe sua quantia em dinheiro",
  aliases: [],
  category: "economy",
  api_data: {
    category: "Economia",
    synonyms: [],
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async (message: Message<true>, _: string[] | undefined) => await lottoPainel(message),
};
