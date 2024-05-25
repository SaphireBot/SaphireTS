import { Message, TextChannel } from "discord.js";
import Glass from "../../../structures/glass/GlassesWar";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default {
    name: "lata",
    description: "Um jogo divertido",
    aliases: ["g", "copo", "glass", "latas"],
    category: "games",
    api_data: {
        category: "Jogos",
        synonyms: ["g", "copo", "glass", "latas"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        if (ChannelsInGame.has(message.channelId))
            return await message.reply({
                content: t("glass.channel_in_use", { e, locale: message.userLocale })
            })
                .then((msg) => setTimeout(() => msg.delete().catch(() => { }), 5000));

        return new Glass(
            {
                authorId: message.author.id,
                channelId: message.channelId,
                guildId: message.guildId,
                lives: {}
            },
            message,
            {
                author: message.author,
                channel: message.channel as TextChannel,
                guild: message.guild
            }
        );
    }
};