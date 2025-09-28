import { Message } from "discord.js";
import { Battleroyale } from "../../../structures/battleroyale/battleroyale";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import battlaroyaleRanking from "../../functions/battleroyale/ranking";
import { ChannelsInGame } from "../../../util/constants";
const aliases = ["br", "huntergames", "hg", "battle", "arena", "schlacht", "batalla", "arène", "bataille", "アリーナ", "戦い", "竞技场", "战斗"];

export default {
    name: "battleroyale",
    description: "A super way to fight with everybody",
    aliases,
    category: "games",
    api_data: {
        category: "Diversão",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        if (
            [
                "rangliste",
                "ranking",
                "rank",
                "top",
                "podium",
                "pódio",
                "status",
                "estado",
                "classement",
                "statut",
                "ランキング",
                "表彰台",
                "状態",
                "排名",
                "领奖台",
                "状态",
            ]
                .includes(args?.[0]?.toLowerCase() || "")
        )
            return await battlaroyaleRanking(message, (args?.[1] as any) || "wins");

        if (ChannelsInGame.has(message.channelId))
            return await message.reply({
                content: t("battleroyale.a_party_in_running", { e, locale: message.userLocale }),
            })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 1000 * 5));

        return new Battleroyale(message).load();
    },
};