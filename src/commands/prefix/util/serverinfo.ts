import { Message } from "discord.js";
import serverinfo from "../../functions/serverinfo";
const aliases = ["si", "guildinfo", "gi"];

export default {
    name: "serverinfo",
    description: "A server info command",
    aliases,
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {
        return await serverinfo(message, args || []);
    }
};