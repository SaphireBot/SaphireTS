import { ButtonStyle, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
const aliases = ["speicher", "内存", "メモリ", "mémoire", "memoria", "memória", "m"];
export const ChannelsInMemoryGame = new Set<string>();

export default {
    name: "memory",
    description: "",
    aliases,
    category: "games",
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

        const { userLocale: locale, channelId, author } = message;

        if (ChannelsInMemoryGame.has(channelId))
            return await message.reply({
                content: t("memory.this_channel_is_in_game", { e, locale })
            })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 1000 * 5));

        return await message.reply({
            content: t("memory.new_game", { e, locale }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("memory.components.0", locale),
                            custom_id: JSON.stringify({ c: "memory", src: "solo", uid: author.id }),
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("memory.components.1", locale),
                            custom_id: "0",
                            style: ButtonStyle.Primary,
                            disabled: true
                        },
                        {
                            type: 2,
                            label: t("memory.components.2", locale),
                            custom_id: "1",
                            style: ButtonStyle.Primary,
                            disabled: true
                        },
                        {
                            type: 2,
                            label: t("memory.components.3", locale),
                            custom_id: JSON.stringify({ c: "memory", src: "sequency", uid: author.id }),
                            style: ButtonStyle.Primary
                        }
                    ]
                }
            ]
        });
    }
};