import { Message } from "discord.js";
import lauch from "../../functions/elimination/lauch";
const aliases = [
  "elimination", "eliminierung", "eliminación", "除去", "消除", "eliminação",
  "eliminacion", "eliminaçao", "elm"
];

export default {
  name: "elimination",
  description: "Elimine os jogadores e seja o último vivo",
  aliases,
  category: "games",
  api_data: {
    category: "Diversão",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async (message: Message<true>, _: string[] | undefined) => await lauch(message)
};