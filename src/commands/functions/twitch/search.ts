import { ChatInputCommandInteraction, Message } from "discord.js";
import categories from "./categories.search";
import channels from "./channels.search";
import { e } from "../../../util/json.js";
import { t } from "../../../translator/index.js";
import fetcher from "./fetcher";

export default async (
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
    searchInput?: string
) => {

    const { userLocale: locale } = interactionOrMessage;

    const category: "categories" | "channels" = interactionOrMessage instanceof Message
        ? "channels"
        : interactionOrMessage.options.getString("type") as "categories" | "channels";

    const input = interactionOrMessage instanceof Message
        ? searchInput!.replace(/\s/g, "%20")
        : (interactionOrMessage.options.getString("input") || "").replace(/\s/g, "%20");

    const msg = await interactionOrMessage.reply({ content: t("twitch.loading", { e, locale }), fetchReply: true });
    const res = await fetcher(`https://api.twitch.tv/helix/search/${category}?query=${input}&first=25`) as any;

    if ("message" in res)
        return await msg.edit({ content: t("twitch.timeout", { e, locale }) }).catch(() => { });

    return { categories, channels }[category](msg, res, locale, interactionOrMessage.member!);

};