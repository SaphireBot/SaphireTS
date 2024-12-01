import { Message } from "discord.js";
import Tictactoe from "../../../structures/tictactoe/tictactoe";
import tictactoeStatus from "../../../structures/tictactoe/status";
import tictactoeCredits from "../../../structures/tictactoe/credits";
const aliases = ["jogodavelha", "velha", "ttt"];

export default {
  name: "tictactoe",
  description: "O famoso jogo da velha",
  aliases,
  category: "games",
  api_data: {
    category: "Diversão",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    if (args?.[0] && ["s", "info", "status"].includes(args?.[0]))
      return await tictactoeStatus(message);

    if (args?.[0] && ["c", "crédito", "créditos", "credits"].includes(args[0]))
      return await tictactoeCredits(message);

    new Tictactoe(message);
    return;
  },
};