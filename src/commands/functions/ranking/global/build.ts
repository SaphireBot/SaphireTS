import { Message, Colors, ChatInputCommandInteraction, StringSelectMenuInteraction, InteractionResponse, AttachmentBuilder, time } from "discord.js";
import { t } from "../../../../translator";
import client from "../../../../saphire";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { categories } from "./ranking";
import { urls } from "../../../../util/constants";

const customRankingData = {
    balance: { translateKey: "keyword_Sapphires", emoji: e.safira },
    likes: { translateKey: "ranking.type.likes", emoji: e.Like },
    daily: { translateKey: "ranking.type.daily", emoji: "📆" },
    level: { translateKey: "ranking.type.level", emoji: e.RedStar },
    logomarca: { translateKey: "ranking.type.logomarca", emoji: e.logomarca },
    flags: { translateKey: "ranking.type.flags", emoji: "🔰" },
    quiz_anime: { translateKey: "ranking.type.quiz_anime", emoji: e.KuramaFogo },
    quiz_questions: { translateKey: "ranking.type.quiz_questions", emoji: e.QuestionMark }
};

export default async function build(
    interactionOrMessage: ChatInputCommandInteraction | StringSelectMenuInteraction | Message,
    msg: Message<boolean> | InteractionResponse<boolean>,
    category: "balance" | "likes" | string,
    script?: boolean | string
) {

    const { userLocale: locale } = interactionOrMessage;
    const userId = "author" in interactionOrMessage ? interactionOrMessage.author.id : interactionOrMessage.user.id;

    const data = (await Database.Ranking.zRangeWithScores(category, 0, -1, { REV: true }) as any) as { value: string, score: number }[];
    if (!data)
        return await msg.edit({ content: t("ranking.no_content_found", { e, locale }) });

    const users = await client.getUsers(data.slice(0, 15).map(d => d.value));

    await msg.edit({ content: t("ranking.building", { e, locale }) });

    if (script) {

        const attachment = new AttachmentBuilder(
            Buffer.from(`
    ${t(`ranking.script.${category}`, { locale, date: new Date().toLocaleDateString(locale) + " " + new Date().toLocaleTimeString(locale) })}
${data.map((d, i) => `${i + 1}. ${d.value}: ${d.score}`).join("\n")}
            `),
            {
                name: "ranking.txt",
                description: "List with all banned used from this guild"
            }
        );

        return await msg.edit({ content: null, files: [attachment] });
    }

    const description = await format();
    const cacheData = (await Database.Ranking.json.get("data") as any);

    if (!description?.length)
        return await msg.edit({
            content: null,
            embeds: [
                {
                    color: Colors.Blue,
                    title: t(`ranking.embed.title.${category}`, locale),
                    description: t("ranking.embed.description", {
                        locale,
                        nextUpdate: time(new Date(cacheData?.nextUpdate || Date.now() + (1000 * 60 * 15)), "R"),
                        lastUpdate: time(new Date(cacheData?.lastUpdate || Date.now() - (1000 * 60 * 15)), "R"),
                    }).limit("MessageEmbedDescription"),
                    image: {
                        url: urls.not_found_image
                    }
                }
            ],
            components: [{
                type: 1,
                components: [{
                    type: 3,
                    custom_id: JSON.stringify({ c: "ranking", uid: userId }),
                    placeholder: t("ranking.select_menu.placeholder", locale),
                    options: categories.map(({ type, emoji }) => ({
                        label: t(`ranking.select_menu.options.${type}`, locale),
                        value: type,
                        emoji
                    }))
                }]
            }].asMessageComponents()
        });

    const userRankingPosition = await Database.Ranking.zRevRank(category, userId);

    return await msg.edit({
        content: null,
        embeds: [
            {
                color: Colors.Blue,
                title: t(`ranking.embed.title.${category}`, locale),
                description: t("ranking.embed.description", {
                    locale,
                    nextUpdate: time(new Date(cacheData?.nextUpdate || Date.now() + (1000 * 60 * 15)), "R"),
                    lastUpdate: time(new Date(cacheData?.lastUpdate || Date.now() - (1000 * 60 * 15)), "R"),
                    description,
                }).limit("MessageEmbedDescription"),
                footer: {
                    text: typeof userRankingPosition === "number" ? t("ranking.embed.footer", { locale, index: userRankingPosition + 1 }) : ""
                }
            }
        ],
        components: [{
            type: 1,
            components: [{
                type: 3,
                custom_id: JSON.stringify({ c: "ranking", uid: userId }),
                placeholder: t("ranking.select_menu.placeholder", locale),
                options: categories.map(({ type, emoji }) => ({
                    label: t(`ranking.select_menu.options.${type}`, locale),
                    value: type,
                    emoji
                }))
            }]
        }].asMessageComponents()
    });

    async function format() {
        let i = 0;
        let description = "";

        for await (const { value, score } of data) {

            const user = users.find(u => u.id === value) || await client.getUser(userId);
            if (user?.username?.includes("Deleted User")) {
                await Database.Users.deleteOne({ id: value });
                await Database.UserCache.del(value);
                await Database.Ranking.del(value);
                await Database.Redis.del(value);
                continue;
            }

            if (!user) continue;
            i++;
            description += `${i}. ${user.username} \`${user.id}\`\n${customRankingData[category as keyof typeof customRankingData]?.emoji} ${(score || 0).currency()} ${t(customRankingData[category as keyof typeof customRankingData]?.translateKey, locale)}\n \n`;
            if (i === 10) break;
        }

        return description;
    }

}