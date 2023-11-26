import { Message } from "discord.js";
import BattleRoyale from "../../functions/battleroyale";
const aliases = ["battle", "bl"];

export default {
    name: "battleroyale",
    description: "A funny way to kill everyone",
    aliases,
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
    execute: async (message: Message<true>, _: string[] | undefined) => await new BattleRoyale(message).load()
};