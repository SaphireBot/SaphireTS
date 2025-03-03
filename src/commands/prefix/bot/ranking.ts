import globalRanking from "../../functions/ranking/global/ranking";
const aliases = ["rank", "rangliste", "排名", "ランキング", "classement", "pódio", "podium", "领奖台", "表彰台", "podio", "top"];

export default {
    name: "ranking",
    description: "General ranking system",
    aliases,
    category: "bot",
    api_data: {
        category: "Saphire",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: globalRanking,
};