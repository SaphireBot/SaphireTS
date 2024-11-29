import { Message } from "discord.js";
import logSystemServer from "../../../structures/server/logsystem.server";
import kickLogs from "../../../structures/logs/kick/lauch.kick";
import banLogs from "../../../structures/logs/ban/lauch.ban";
import lauchMessageControl from "../../../managers/messagesLogsControl/lauch.control";
import Database from "../../../database";

export default {
  name: "logs",
  description: "Um simples sistema de logs",
  aliases: ["log"],
  category: "moderation",
  api_data: {
    category: "Moderação",
    synonyms: ["log"],
    tags: ["new", "buildind"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async (message: Message<true>, args: string[] | undefined) => {

    if (["kick"].includes(args?.[0] || ""))
      return await kickLogs(message);

    if (["ban"].includes(args?.[0] || ""))
      return await banLogs(message);

    if (["message"].includes(args?.[0] || ""))
      return await lauchMessageControl(message, await Database.getGuild(message.guildId));

    return await logSystemServer(message);
  },
};