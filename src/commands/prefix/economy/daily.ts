import { Message } from "discord.js";
import dailySequency from "../../functions/daily/sequency";
import daily from "../../functions/daily/daily";
const aliases = ["diário", "täglich", "diario", "quotidien", "毎日", "dl"];
const statusKeywords = [
    // status
    "status",
    "状态",
    "ステータス",
    "statut",
    "estatus",
    "s",

    // sequence
    "sequência",
    "sequence",
    "sequency",
    "sequency",
    "sequenz",
    "序列",
    "シークエンス",
    "séquence",
    "secuencia",
];

export default {
    name: "daily",
    description: "Get a daily rewards",
    aliases: aliases,
    category: "economy",
    dm: true,
    api_data: {
        category: "Economia",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message, args: string[]) {

        if (statusKeywords.includes(args[0]?.toLowerCase()))
            return await dailySequency(message);

        return await daily(message);
    },
};