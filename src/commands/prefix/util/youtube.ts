import { Message } from "discord.js";
import { e } from "../../../util/json";
import handler from "../../../structures/commands/handler";

export default {
  name: "youtube",
  description: "Search things in YouTube",
  aliases: ["ytb", "yt"],
  category: "util",
  api_data: {
    category: "Pesquise coisas no YouTube",
    synonyms: ["ytb", "yt"],
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, args: string[]) {

    if (!args?.length) {
      await message.react(e.youtube).catch(() => { });
      await message.react(e.QuestionMark).catch(() => { });
      return;
    }

    const command = handler.getSlashCommand("youtube");
    if (!command) return;
    return await command.additional.execute(message as any, args);
  }
};