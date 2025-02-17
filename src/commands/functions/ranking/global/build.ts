import { Message, Colors, ChatInputCommandInteraction, StringSelectMenuInteraction, AttachmentBuilder, time, PermissionFlagsBits } from "discord.js";
import { t } from "../../../../translator";
import client from "../../../../saphire";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { categories } from "./ranking";
import { PermissionsTranslate, urls } from "../../../../util/constants";
import { position } from "./functions";
import balanceRanking from "./balance/balance.rank";
import reply from "./reply";
import balanceScript from "./balance/balance.script";
import levelScript from "./level/level.script";
import levelRanking from "./level/level.rank";

const customRankingData = {
    balance: { translateKey: "keyword_Sapphires", emoji: e.safira },
    likes: { translateKey: "ranking.type.likes", emoji: e.Like },
    daily: { translateKey: "ranking.type.daily", emoji: "📆" },
    level: { translateKey: "ranking.type.level", emoji: e.RedStar },
    logomarca: { translateKey: "ranking.type.logomarca", emoji: e.logomarca },
    flags: { translateKey: "ranking.type.flags", emoji: "🔰" },
    quiz_questions: { translateKey: "ranking.type.quiz_questions", emoji: e.QuestionMark },
};

export default async function build(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | Message<true>,
    category: "balance" | "likes" | "level" | string,
    script?: boolean | string,
) {

    const { userLocale: locale, guild } = interactionOrMessage;
    const user = "author" in interactionOrMessage ? interactionOrMessage.author : interactionOrMessage.user;

    if (category === "balance" && !script)
        return await balanceRanking(interactionOrMessage);

    if (category === "level" && !script)
        return await levelRanking(interactionOrMessage);

    const data = (await Database.Ranking?.zRangeWithScores(category, 0, -1, { REV: true }) as any) as { value: string, score: number }[];
    if (!data) return await reply(
        interactionOrMessage,
        undefined,
        { content: t("ranking.no_content_found", { e, locale }) });
    const users = await client.getUsers(data.slice(0, 15).map(d => d.value));
    const length = `${data.length + 1}`.length;
    let msg: Message<boolean> | undefined = undefined;
    msg = await reply(
        interactionOrMessage,
        msg,
        { content: t("ranking.building", { e, locale }) },
    );

    if (script) {

        if (guild && !guild.members.me!.permissions.has(PermissionFlagsBits.AttachFiles))
            return await reply(
                interactionOrMessage,
                msg,
                {
                    content: t("embed.no_attach_files_permission", { e, locale, perm: PermissionsTranslate.AttachFiles }),
                });

        if (category === "balance")
            return await balanceScript(interactionOrMessage, msg);

        if (category === "level")
            return await levelScript(interactionOrMessage, msg);

        const attachment = new AttachmentBuilder(
            Buffer.from(
                `${t(`ranking.script.${category}`, { locale, date: new Date().toLocaleDateString(locale) + " " + new Date().toLocaleTimeString(locale), user, msgUrl: msg?.url || "Origin Not Found" })}
${data.map((d, i) => `${position(length, i + 1)}. ${d.value}: ${(d.score || 0).currency()}`).join("\n")}`,
            ),
            {
                name: "ranking.txt",
                description: "Saphire Database Information Public Access",
            },
        );

        return await reply(
            interactionOrMessage,
            msg, { content: null, files: [attachment] });
    }

    const description = await format();
    const cacheData = (await Database.Ranking?.json.get("data") as any);

    if (!description?.length)
        return await reply(
            interactionOrMessage,
            msg,
            {
                content: null,
                embeds: [
                    {
                        color: Colors.Blue,
                        title: t(`ranking.embed.title.${category}`, locale),
                        description: t("ranking.embed.description", {
                            locale,
                            nextUpdate: time(new Date(cacheData?.nextUpdate || Date.now() + (1000 * 60 * 15)), "R"),
                            lastUpdate: time(new Date(cacheData?.lastUpdate || Date.now() - (1000 * 60 * 15)), "R"),
                        }).limit("EmbedDescription"),
                        image: {
                            url: urls.not_found_image,
                        },
                    },
                ],
                components: [{
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: JSON.stringify({ c: "ranking", uid: user.id }),
                        placeholder: t("ranking.select_menu.placeholder", locale),
                        options: categories.map(({ type, emoji }) => ({
                            label: t(`ranking.select_menu.options.${type}`, locale),
                            value: type,
                            emoji,
                        })),
                    }],
                }].asMessageComponents(),
            });

    const userRankingPosition = await Database.Ranking?.zRevRank(category, user.id);

    return await reply(
        interactionOrMessage,
        msg,
        {
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
                    }).limit("EmbedDescription"),
                    footer: {
                        text: typeof userRankingPosition === "number" ? t("ranking.embed.footer", { locale, index: userRankingPosition + 1 }) : "",
                    },
                },
            ],
            components: [{
                type: 1,
                components: [{
                    type: 3,
                    custom_id: JSON.stringify({ c: "ranking", uid: user.id }),
                    placeholder: t("ranking.select_menu.placeholder", locale),
                    options: categories.map(({ type, emoji }) => ({
                        label: t(`ranking.select_menu.options.${type}`, locale),
                        value: type,
                        emoji,
                    })),
                }],
            }].asMessageComponents(),
        });

    async function format() {
        let i = 0;
        let description = "";

        for await (const { value, score } of data) {

            const u = users.find(u => u.id === value) || await client.getUser(user.id).catch(() => null);
            if (u?.username?.includes("Deleted User") || u?.username?.includes("deleted_user_")) {
                await removeUser(value);
                continue;
            }

            if (!u) continue;
            i++;
            description += `${i}. ${u.username} \`${u.id}\`\n${customRankingData[category as keyof typeof customRankingData]?.emoji} ${(score || 0).currency()} ${t(customRankingData[category as keyof typeof customRankingData]?.translateKey, locale)}\n \n`;
            if (i === 10) break;
        }

        return description;
    }

}

async function removeUser(userId: string) {
    await Promise.all([
        Database.Users.deleteOne({ id: userId }),
        Database.UserCache?.del(userId),
        Database.Ranking?.del(userId),
        Database.Redis?.del(userId),
    ]);
}