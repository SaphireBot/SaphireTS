import { ButtonInteraction, ChatInputCommandInteraction, Colors, Message } from "discord.js";
import Database from "../../../../database/index.js";
import { e } from "../../../../util/json.js";
import { t } from "../../../../translator/index.js";
import rankMember from "./tempcall.member";
import { getPaginationButtons } from "../../../components/buttons/buttons.get.js";

export default async (
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
    args?: string[],
) => {

    const { guild, userLocale: locale } = interactionOrMessage;
    const user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;
    const msg = await interactionOrMessage.reply({ content: t("tempcall.loading", { e, locale }) });
    const data = (await Database.getGuild(guild.id))?.TempCall || {};

    if (
        !data
        || (!data?.members && !data?.membersMuted)
        || (
            !Object.values(data?.members || {})?.length
            && !Object.values(data?.membersMuted || {})?.length
        )
    )
        return await msg.edit({ content: t("tempcall.empty_ranking", { e, locale }) });

    if (interactionOrMessage instanceof Message)
        await interactionOrMessage.parseMemberMentions();

    const member = "options" in interactionOrMessage
        ? interactionOrMessage.options.getMember("member")
        : interactionOrMessage.mentions.members.size || args?.[1]
            ? [
                "me",
                "ich",
                "eu",
                "i",
                "yo",
                "je",
                "私",
            ].includes(args?.[1]?.toLowerCase() as string)
                ? interactionOrMessage.member
                : interactionOrMessage.mentions.members.first()
            : undefined;

    if (member) return await rankMember(msg, member, data, locale);

    const usersId = Array.from(new Set([Object.keys(data?.members || {}), Object.keys(data?.membersMuted || {})].flat()));

    if (!usersId?.length)
        return await msg.edit({ content: t("tempcall.anyone_found", { e, locale }) });

    if (!data.members) data.members = {};
    if (!data.membersMuted) data.membersMuted = {};

    await guild.members.smartFetch();
    const dataSorted = usersId
        .map(userId => ({ member: guild.members.cache.get(userId), OnTime: data?.members[userId] || 0, offTime: data?.membersMuted[userId] || 0 }))
        .filter(d => d.member)
        .sort((a, b) => b.OnTime - a.OnTime);

    const userRanking = (() => {
        const i = dataSorted.findIndex(d => d.member?.id === user.id) + 1;
        return i > 0 ? t("tempcall.user_position", { locale, i }) : "";
    })();

    const format = dataSorted
        .map((d, i) => {
            return `${emojiRanking(i)} ${d.member?.user?.username || "??"} \`${d.member?.id}\`\n🎙️ \`${Date.stringDate(d.OnTime, false, locale) || "??"}\`\n🔇 \`${Date.stringDate(d.offTime, false, locale) || "??"}\``;
        });

    if (format.length <= 20)
        return await msg.edit({
            content: null,
            embeds: [{
                color: Colors.Blue,
                title: t("tempcall.embed_ranking_title", { locale, guild }),
                description: format.join("\n") || t("tempcall.empty", locale),
                footer: {
                    text: t("tempcall.embed_footer_text", { locale, userRanking, format }),
                },
            }],
        });

    const embeds = EmbedGenerator(format);

    if (!embeds.length)
        return await msg.edit({ content: t("tempcall.embeds_not_builded", { e, locale }) });

    let index = 0;

    const components = embeds.length > 1 ? getPaginationButtons() : [];

    await msg.edit({ content: null, embeds: [embeds[index]], components });

    if (embeds.length <= 1) return;

    return msg.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: (1000 * 60) * 5,
    })
        .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

            const { customId } = int;

            if (customId === "zero") index = 0;
            if (customId === "left") index = index <= 0 ? embeds.length - 1 : index - 1;
            if (customId === "right") index = index >= embeds.length - 1 ? 0 : index + 1;
            if (customId === "last") index = embeds.length - 1;

            return await int.update({ embeds: [embeds[index]] });
        })
        .on("end", async (): Promise<any> => {
            embeds[index].color = Colors.Red as any;
            return await msg.edit({ embeds: [embeds[index]], components: [] });
        });

    function EmbedGenerator(array: string[]) {

        let amount = 10;
        let page = 1;
        const embeds = [];
        const length = array.length / 10 <= 1 ? 1 : parseInt(((array.length / 10) + 1).toFixed(0));

        for (let i = 0; i < array.length; i += 10) {

            const current = array.slice(i, amount);
            const description = current.join("\n");
            const pageCount = length > 1 ? ` ${page}/${length}` : "";

            embeds.push({
                color: Colors.Blue,
                title: t("tempcall.embed_ranking_title", { locale, guild }) + pageCount,
                description,
                footer: {
                    text: t("tempcall.embed_footer_text", { locale, userRanking, format }),
                },
            });

            page++;
            amount += 10;

        }

        return embeds;
    }

    function emojiRanking(i: number) {
        return { 0: "🥇", 1: "🥈", 2: "🥉" }[i] || `${i + 1}. `;
    }
};