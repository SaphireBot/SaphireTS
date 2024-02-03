import { Message } from "discord.js";
import { t } from "../../../translator";
const aliases = ["história", "history", "geschichte", "历史", "歴史", "histoire", "historia", "h"];

export default {
    name: "history",
    description: "[others] Read amazing histories",
    aliases,
    category: "others",
    api_data: {
        category: "Diversão",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, _: string[] | undefined) {

        const { author, userLocale: locale } = message;
        return await message.reply({
            components: [
                {
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: "history",
                        placeholder: t("history.choose_your_title", locale),
                        options: [
                            {
                                label: t("sollaris.title", locale),
                                emoji: "📖",
                                value: JSON.stringify({ pg: "1", k: "sollaris", uid: author.id })
                            }
                        ]
                    }]
                }
            ].asMessageComponents()
        });

    }
};