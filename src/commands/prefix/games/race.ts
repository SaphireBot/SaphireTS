import { Message } from "discord.js";
import Race from "../../functions/race";

export default {
    name: "race",
    description: "",
    aliases: [],
    category: "",
    api_data: {
        category: "",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {
        return new Race(message).load();
    }
};