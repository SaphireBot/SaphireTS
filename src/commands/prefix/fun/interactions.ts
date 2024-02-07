import { Colors, Message } from "discord.js";
import { getGifs } from "../../functions/fun/gifs";
import interactions from "../../../JSON/interactions.json";
import { t } from "../../../translator";
import { e } from "../../../util/json";
const aliases = Object.entries(interactions).map(([key, values]) => [key, ...values]).flat();
const need_a_member = ["lurk", "shoot", "stare", "wave", "poke", "peck", "tickle", "yeet", "highfive", "feed", "bite", "cuddle", "kick", "hug", "baka", "pat", "nod", "kiss", "punch", "slap", "handhold"];

export default {
    name: "gif",
    description: "[fun] A super command to interact with another user",
    aliases,
    category: "fun",
    api_data: {
        category: "Diversão",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined, commandName: string) {

        const gifs = await getGifs(commandName);
        const gif = gifs.gifs?.random();
        if (!gif) return;

        const { author, userLocale } = message;
        const member = await message.getMember();
        const memberLocale = await member?.user?.locale();

        if (need_a_member.includes(gifs.endpoint!) && !member)
            return await message.reply({ content: t("interactions.need_a_member", { e, locale: userLocale }) });

        const msg = await message.reply({
            embeds: [{
                color: Colors.Blue,
                description: args?.length && !member
                    ? args.join(" ").limit("MessageEmbedDescription")
                    : (
                        (userLocale && memberLocale)
                        && userLocale === memberLocale
                    )
                        ? t(`interactions.${gifs.endpoint}`, {
                            e,
                            locale: userLocale,
                            author,
                            member: member || author
                        })
                        : `${t(`interactions.${gifs.endpoint}`, {
                            e,
                            locale: userLocale,
                            author,
                            member: member || author
                        })}` + `\n${t(`interactions.${gifs.endpoint}`, {
                            e,
                            locale: memberLocale,
                            author,
                            member: member || author
                        })}`,
                image: { url: gif.url },
                footer: {
                    text: `💗 Powered By: nekos.best API - Anime: ${gif.anime_name}`
                }
            }]
        });

        if (msg.embeds?.[0].description?.includes(`@${member?.id}`))
            await msg.react("🔄").catch(() => { });

        return;
    }
};