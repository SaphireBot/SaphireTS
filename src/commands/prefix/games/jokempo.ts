import { Message } from "discord.js";
import guild from "../../slash/games/jokempo/guild";
import global from "../../slash/games/jokempo/global";

export default {
    name: "jokempo",
    description: "Um simples jogo de Jokempo",
    aliases: ["jkp", "janken", "じゃんけんぽん", "rock_paper_scissors", "piedra_papel_tijera", "pierre_papier_ciseaux"],
    category: "games",
    api_data: {
        category: "Diversão",
        synonyms: ["jkp", "janken", "じゃんけんぽん", "rock_paper_scissors", "piedra_papel_tijera", "pierre_papier_ciseaux"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        if (["global", "g", "全球", "グローバル"].includes(args?.[0]?.toLowerCase() || ""))
            return await global(message);

        return await guild(message, args);
    }
};