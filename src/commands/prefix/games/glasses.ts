import { Message, TextChannel } from "discord.js";
import Glass from "../../../structures/glass/GlassesWar";
import { ChannelsInGame, allWordTranslations } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";

export default {
    name: "glasses",
    description: "Um jogo divertido",
    aliases: ["g", "copo", "glass", "lata", "latas"],
    category: "games",
    api_data: {
        category: "Diversão",
        synonyms: ["g", "copo", "glass", "latas"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        if (ChannelsInGame.has(message.channelId))
            return await message.reply({
                content: t("glass.channel_in_use", { e, locale: message.userLocale })
            })
                .then((msg) => setTimeout(() => msg.delete().catch(() => { }), 5000));

        let numOfGlasses = 0;
        let value = 0;

        if (args?.some(str => allWordTranslations.includes(str?.toLowerCase())))
            value = (await Database.getUser(message.author.id))?.Balance || 0;
        else {
            if ((args?.length || 0) === 2) {
                if (Number(args?.[0]) > 0) numOfGlasses = Number(args?.[0]);
                value = args?.[1]?.toNumber() || 0;
            }

            if ((args?.length || 0) === 1)
                if (Number(args?.[0]) > 0) numOfGlasses = Number(args?.[0]);
                else value = args?.[0]?.toNumber() || 0;
        }

        return new Glass(
            {
                authorId: message.author.id,
                channelId: message.channelId,
                guildId: message.guildId,
                lives: {},
                numOfGlasses,
                value
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