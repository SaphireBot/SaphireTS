import { Message } from "discord.js";
import inGuildJokempo from "../../slash/games/jokempo/inGuild";

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
        return await inGuildJokempo(message, args);
    }
};