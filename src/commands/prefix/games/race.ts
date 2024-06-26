import { Message } from "discord.js";
import Race from "../../functions/race";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { ChannelsInGame } from "../../../util/constants";
const aliases = ["corrida", "race", "rennen", "比赛", "レース", "course", "carrera", "run"];

export default {
    name: "race",
    description: "Aposte corrida com outras pessoas",
    aliases: aliases,
    category: "games",
    api_data: {
        category: "Diversão",
        synonyms: aliases,
        tags: ["new"],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        if (ChannelsInGame.has(message.channelId))
            return await message.reply({
                content: t("race.has_a_game_in_this_channel", { e, locale: message.userLocale })
            });

        return await new Race(message).load();
    }
};