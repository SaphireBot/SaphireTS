import { Message } from "discord.js";
const stickers = new Set<string>();

export default {
    name: "genshin",
    description: "genshin",
    aliases: [],
    category: "fun",
    api_data: {
        category: "Diversão",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, _: string[] | undefined) {
        const sticker = stickers?.size ? Array.from(stickers).random() : await fetcher();
        return await message.reply({ content: sticker || "No Sticker Found" });
    }
};

async function fetcher() {
    const tenorStickers = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURI("genshin impact")}&key=AIzaSyCSKkhrspRDEpZy5iYwNKSVGEeAgh_UvFI&client_key=pivotal-data-403604&limit=50&searchfilter=sticker`)
        .then(res => res.json())
        .then((res: any) => res?.results || [])
        .then(res => res.map((d: any) => d?.media_formats?.tinygifpreview?.url))
        .catch(err => {
            console.log("tenor.googleapis.com", err);
            return [];
        }) as string[];

    for (const sticker of tenorStickers) stickers.add(sticker);
    setTimeout(() => stickers.clear(), 1000 * 60);
    return tenorStickers.random();
}