import { APIEmbed, Colors, Message } from "discord.js";
import { getGifs } from "../../functions/fun/gifs";
import interactions from "../../../JSON/interactions.json";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import all from "../../functions/fun/all";
const aliases = Object.entries(interactions).map(([key, values]) => [key, ...values]).flat();
export const need_a_member = ["lurk", "shoot", "stare", "poke", "peck", "tickle", "yeet", "highfive", "feed", "bite", "cuddle", "kick", "hug", "baka", "pat", "kiss", "punch", "slap", "handhold"];

export default {
    name: "interactions",
    description: "[fun] A super command to interact with another user",
    aliases: [...aliases, "gifs"],
    category: "fun",
    api_data: {
        category: "Diversão",
        synonyms: [...aliases, "gifs"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined, commandName: string) {

        const { author, userLocale } = message;

        if (
            [
                "alles",
                "everything",
                "todo",
                "all",
                "tout",
                "全て",
                "一切",
                "alle",
                "everyone",
                "todos",
                "tous",
                "みんな",
                "所有人"
            ]
                .includes(args?.[0] || "")
        )
            return await all(message);

        const gifs = await getGifs(commandName);
        const gif = gifs.gifs?.random();
        if (!gif) return;

        let member = await message.getMember(); // message.mentions.members.first();
        if (member?.user?.id === author.id) member = undefined;
        const memberLocale = (await member?.user?.locale()) || userLocale;

        if (need_a_member.includes(gifs.endpoint!) && !member)
            return await message.reply({ content: t("interactions.need_a_member", { e, locale: userLocale }) });

        const embed: APIEmbed = {
            color: Colors.Blue,
            image: { url: gif.url }
        };

        if (gif.anime_name || member)
            embed.footer = {
                text: `Anime: ${gif.anime_name || "GIF by Tenor"}`
            };

        const msg = await message.reply({
            content: (args?.[1]) || !member?.user?.id
                ? args?.[1] ? args?.join(" ")?.limit("MessageEmbedDescription") : ""
                : (userLocale && memberLocale) && (userLocale === memberLocale)
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
            embeds: [embed]
        });

        if (msg.content?.includes(`@${member?.id}`) && member)
            await msg.react("🔄").catch(() => { });

        return;

    }
};