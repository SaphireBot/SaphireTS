import { Message } from "discord.js";
import Lastclick from "../../../structures/lastclick/lastlclick";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { ChannelsInGame } from "../../../util/constants";
const aliases = ["lc"];

export default {
    name: "lastclick",
    description: "[jogo] Se você for o último a clicar, você perdeu.",
    aliases,
    category: "game",
    api_data: {
        category: "Diversão",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        const { userLocale: locale, channelId } = message;
        if (ChannelsInGame.has(channelId))
            return await message.reply({
                content: t("lastclick.this_channels_is_in_game", { e, locale })
            }).then(msg => {
                return setTimeout(async () => {
                    await msg.delete().catch(() => { });
                    await message.delete().catch(() => { });
                }, (1000 * 5));
            });

        return new Lastclick(message).load();
    }
};