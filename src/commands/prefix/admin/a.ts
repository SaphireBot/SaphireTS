import { Message } from "discord.js";
import database from "../../../database";

export default {
    name: "test",
    description: "Comandos exclusivos para os administradores da Saphire",
    aliases: [],
    category: "admin",
    api_data: {
        category: "Administração",
        synonyms: [],
        tags: ["t"],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {
        return message.reply("ok");
    }
};