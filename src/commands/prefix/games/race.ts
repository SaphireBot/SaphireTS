import { Message } from "discord.js";
import Race, { channelsInGane } from "../../functions/race";
import { t } from "../../../translator";
import { e } from "../../../util/json";
const aliases = ["corrida", "race", "rennen", "比赛", "レース", "course", "carrera"];

export default {
    name: "race",
    description: "Aposte corrida com outras pessoas",
    aliases: aliases,
    category: "games",
    api_data: {
        category: "Jogos",
        synonyms: aliases,
        tags: ["new"],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        if (channelsInGane.has(message.channelId))
            return await message.reply({
                content: t("race.has_a_game_in_this_channel", { e, locale: message.userLocale })
            });

        return new Race(message).load();
    }
};