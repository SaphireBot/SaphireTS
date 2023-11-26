import { Message } from "discord.js";
import BattleRoyale from "../../functions/battleroyale";
const aliases = ["大逃杀", "バトルロイヤル", "br"];

export default {
    name: "battleroyale",
    description: "A funny way to kill everyone",
    aliases,
    category: "games",
    api_data: {
        category: "Diversão",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async (message: Message<true>, _: string[] | undefined) => await new BattleRoyale(message).load()
};