import { Message } from "discord.js";
import buttonsGame from "../../../structures/buttonsgame/buttonsgame";

const aliases = [
  "tasten",
  "buttons",
  "botones",
  "boutons",
  "ボタン",
  "botões",
  "按钮",
];

export default {
  name: "buttons",
  description: "",
  aliases,
  category: "fun",
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
    return await new buttonsGame(message, args).checkBeforeInicialize();
  },
};