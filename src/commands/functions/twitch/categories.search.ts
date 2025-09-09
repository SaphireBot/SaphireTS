import { Message, LocaleString, GuildMember } from "discord.js";
import { e } from "../../../util/json.js";
import client from "../../../saphire/index.js";
import { t } from "../../../translator/index.js";

export default async (
    message: Message<boolean>,
    data: { box_art_url: "imageUrl.jpg", id: "numberString", name: "string", url?: string }[],
    locale: LocaleString,
    _: GuildMember,
) => {

    if (!data?.length)
        return await message.edit({ content: t("twitch.nothing_found", { e, locale }) }).catch(() => { });

    const description = data
        .map(d => {
            d.url = `https://www.twitch.tv/directory/game/${d.name.replace(/\s/g, "%20")}`;
            return d;
        })
        .map(d => `[${d.name}](${d.url})`)
        .join("\n")
        .limit("EmbedDescription");

    return await message.edit({
        content: null,
        embeds: [{
            color: 0x9c44fb,
            title: t("twitch.search.categories.embeds.title", { e, locale, client }),
            description,
        }],
    });
};