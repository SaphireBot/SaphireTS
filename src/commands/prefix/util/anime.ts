import { ButtonStyle, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default {
    name: "anime",
    description: "[util] Amazing anime command",
    aliases: ["an"],
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: ["an"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        const { author, userLocale: locale } = message;
        return await message.reply({
            content: t("anime.what_do_you_want", { e, locale }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("anime.search_label", locale),
                            emoji: "🔎",
                            custom_id: JSON.stringify({ c: "search_anime", uid: author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("anime.indication_label", locale),
                            emoji: "📃",
                            custom_id: JSON.stringify({ c: "ind_anime", uid: author.id }),
                            style: ButtonStyle.Primary
                        }
                    ]
                }
            ].asMessageComponents()
        });

    }
};