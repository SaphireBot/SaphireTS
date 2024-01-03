import { Message } from "discord.js";
import { e } from "../../../util/json";
const aliases = ["dice", "würfel", "骰子", "サイコロ", "dé", "dado", "dados"];

export default {
    name: "dice",
    description: "Get some random nice from a dice",
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
    execute: async function (message: Message, args: string[] | undefined) {

        let number_of_dices = Number(args?.[0]) || 1;
        if (typeof number_of_dices !== "number" || number_of_dices <= 0 || isNaN(number_of_dices)) number_of_dices = 1;
        if (number_of_dices > 2000) number_of_dices = 2000;
        let result = 0;

        for (let i = 0; i < number_of_dices; i++)
            result += dice();

        return await message.reply({ content: `${e.dice} | \`${result}\`` });

        function dice() {
            return Math.floor(Math.random() * 6) + 1;
        }
    }
};