import { Message } from "discord.js";
import bitcoin from "../../functions/bitcoin/execute";

export default {
    name: "bitcoin",
    description: "DESCRIPTION",
    aliases: ["bt"],
    category: "economy",
    api_data: {
        category: "Economia",
        synonyms: ["bt"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async (message: Message, args: string[] | undefined) => await bitcoin(message, args)
};