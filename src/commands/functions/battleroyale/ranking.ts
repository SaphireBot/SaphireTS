import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, Message, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import refresher from "./refresh";
import client from "../../../saphire";
import Database from "../../../database";
export type battleroyaleRankingData = { deaths: number, kills: number, matches: number, wins: number, username: string };
export type rankingKeys = "deaths" | "kills" | "matches" | "wins" | "me";
export const ranking = {
    deaths: [] as battleroyaleRankingData[],
    kills: [] as battleroyaleRankingData[],
    matches: [] as battleroyaleRankingData[],
    wins: [] as battleroyaleRankingData[],
    me: new Map<string, battleroyaleRankingData>()
};
refresher();

export default async function battlaroyaleRanking(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
    key: rankingKeys
) {

    if (
        [
            "ich",
            "I",
            "yo",
            "je",
            "私",
            "我",
            "mich",
            "me",
            "mí",
            "moi",
            "私を",
            "个人的",
            "persönlich",
            "personal",
            "personnel",
            "個人的な"
        ].includes(key?.toLowerCase())
    ) key = "me";

        if (!key || !["deaths", "kills", "matches", "wins", "me"].includes(key)) key = "wins";
    const { userLocale: locale } = interactionOrMessage;
    const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;
    const me = ranking.me.get(user.id) || (await Database.Battleroyale.findOne({ id: user.id }));

    const embeds = {
        wins: embedBuilder("wins"),
        deaths: embedBuilder("deaths"),
        kills: embedBuilder("kills"),
        matches: embedBuilder("matches"),
        me: [{
            color: Colors.Blue,
            title: t("battleroyale.ranking.embed.title_me", { e, locale }),
            description: t("battleroyale.ranking.embed.description_me", { locale, wins: me?.wins || 0, deaths: me?.deaths || 0, matches: me?.matches || 0, kills: me?.kills || 0 }),
            footer: {
                text: t("battleroyale.ranking.embed.footer", { locale, client })
            }
        }]
    };

    const msg = await interactionOrMessage.reply({
        embeds: [embeds[key][0]],
        components: [
            {
                type: 1,
                components: [{
                    type: 3,
                    custom_id: "ignore",
                    placeholder: t("battleroyale.ranking.select.placeholder", locale),
                    options: [
                        {
                            emoji: "☠️",
                            label: t("battleroyale.ranking.select.options.0.label", locale),
                            description: t("battleroyale.ranking.select.options.0.description", locale),
                            value: "deaths",
                        },
                        {
                            emoji: "🗡️",
                            label: t("battleroyale.ranking.select.options.1.label", locale),
                            description: t("battleroyale.ranking.select.options.1.description", locale),
                            value: "kills",
                        },
                        {
                            emoji: "🎮",
                            label: t("battleroyale.ranking.select.options.2.label", locale),
                            description: t("battleroyale.ranking.select.options.2.description", locale),
                            value: "matches",
                        },
                        {
                            emoji: "🏆",
                            label: t("battleroyale.ranking.select.options.3.label", locale),
                            description: t("battleroyale.ranking.select.options.3.description", locale),
                            value: "wins",
                        },
                        {
                            emoji: "👤",
                            label: t("battleroyale.ranking.select.options.4.label", locale),
                            description: t("battleroyale.ranking.select.options.4.description", locale),
                            value: "me",
                        }
                    ]
                }]
            },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: "⏪",
                        custom_id: "zero",
                        style: ButtonStyle.Primary
                    },
                    {
                        type: 2,
                        emoji: "◀️",
                        custom_id: "preview",
                        style: ButtonStyle.Primary
                    },
                    {
                        type: 2,
                        emoji: "▶️",
                        custom_id: "next",
                        style: ButtonStyle.Primary
                    },
                    {
                        type: 2,
                        emoji: "⏩",
                        custom_id: "last",
                        style: ButtonStyle.Primary
                    },
                    {
                        type: 2,
                        emoji: e.Trash,
                        custom_id: "cancel",
                        style: ButtonStyle.Danger
                    },
                ]
            }
        ].asMessageComponents()
    });

    let index = 0;
    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: (1000 * 60) * 3
    })
        .on("collect", async (int: StringSelectMenuInteraction<"cached"> | ButtonInteraction<"cached">): Promise<any> => {

            const customId = (int instanceof StringSelectMenuInteraction ? int.values[0] : int.customId);

            if (customId === "cancel") return collector.stop();
            if (customId === "preview") index = index <= 0 ? embeds[key].length - 1 : index - 1;
            if (customId === "next") index = index >= (embeds[key].length - 1) ? 0 : index + 1;
            if (customId === "last") index = embeds[key].length - 1;
            if (["deaths", "kills", "matches", "wins", "zero", "me"].includes(customId)) {
                index = 0;
                if (customId !== "zero") key = customId as rankingKeys;
            }

            if (!embeds[key][index]) return;
            return await int.update({ embeds: [embeds[key][index]] }).catch(() => { });
        })
        .on("end", async (): Promise<any> => await msg.delete().catch(() => { }));

    function embedBuilder(key: rankingKeys): APIEmbed[] {
        if (key === "me") return [];
        const embeds: APIEmbed[] = [];
        let rank = 0;

        for (let i = 0; i < ranking[key].length; i += 10)
            embeds.push({
                color: Colors.Blue,
                title: t("battleroyale.ranking.embed.title", { e, locale }),
                description: ranking[key]
                    .slice(i, i + 10)
                    .map(data => `${rank++}. ${data.username || "Anonymous"} - ${data[key]} ${t(`battleroyale.ranking.${key}`, locale)}`)
                    .join("\n") || "Nothing",
                footer: {
                    text: t("battleroyale.ranking.embed.footer", { locale, client })
                }
            });

        return embeds;
    }

}