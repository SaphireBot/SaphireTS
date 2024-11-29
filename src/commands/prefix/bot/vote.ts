import { Message, Colors, parseEmoji, ButtonStyle, Routes, time } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { Config } from "../../../util/constants";
import client from "../../../saphire";
import { TopGGManager } from "../../../managers";
import { Vote } from "../../../@types/database";
const aliases = ["votar", "vote", "abstimmen", "投票", "投票", "voter", "topgg"];
const cancelOptionsLanguages = ["cancelar", "cancel", "stornieren", "取消", "キャンセル", "annuler"];
const reminderOptionsLanguages = ["lembrete", "reminder", "erinnerung", "提醒", "リマインダー", "rappel", "recordatorio"];

export default {
    name: "vote",
    description: "a simple way to get a reward",
    aliases,
    category: "bot",
    api_data: {
        category: "Saphire",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, author, channelId, guildId } = message;
        const msg = await message.reply({ content: t("vote.loading", { e, locale }) });
        const vote = await TopGGManager.fetch(author.id);

        if (cancelOptionsLanguages.includes(args?.[0]?.toLowerCase() || ""))
            return await cancel(vote);

        const data = await Database.getUser(author.id) || {} as any;

        const timeDifferent = (data.Timeouts?.TopGGVote || 0) > Date.now();
        if (timeDifferent)
            return await msg.edit({
                content: t("vote.timeout", {
                    e,
                    locale,
                    time: time(new Date(data.Timeouts!.TopGGVote), "R"),
                    votes: data?.TopGGVotes || 0,
                }),
            }).catch(() => { });

        if (vote)
            if (!vote.messageUrl)
                await TopGGManager.deleteByUserId(author.id);
            else
                return await msg.edit({
                    content: t("vote.your_message_vote", {
                        e,
                        locale,
                        link: vote.messageUrl,
                    }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    emoji: parseEmoji("📨")!,
                                    url: vote.messageUrl,
                                    style: ButtonStyle.Link,
                                },
                                {
                                    type: 2,
                                    label: t("vote.vote", locale),
                                    emoji: parseEmoji(e.topgg)!,
                                    url: Config.TopGGLink,
                                    style: ButtonStyle.Link,
                                },
                                {
                                    type: 2,
                                    label: t("keyword_reset", locale),
                                    emoji: parseEmoji(e.Trash)!,
                                    custom_id: JSON.stringify({ c: "vote", src: "reset", uid: author.id }),
                                    style: ButtonStyle.Primary,
                                },
                            ],
                        },
                    ],
                }).catch(() => { });

        const document = await TopGGManager.createOrUpdate({
            userId: author.id,
            data: {
                $set: {
                    userId: author.id,
                    channelId,
                    guildId,
                    messageId: msg.id,
                    messageUrl: msg.url,
                    deleteAt: Date.now() + (1000 * 60 * 60),
                    enableReminder: vote?.enableReminder || reminderOptionsLanguages.includes(args?.[0]?.toLowerCase() || "") || false,
                },
            },
        });

        return await msg.edit({
            content: document ? null : t("vote.error_to_create", { e, locale }),
            embeds: document
                ? [{
                    color: Colors.Blue,
                    title: `${e.topgg} Top.GG Bot List`,
                    description: t("vote.waiting_vote", { e, locale }),
                }]
                : [],
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        label: t("vote.vote", locale),
                        emoji: parseEmoji(e.Upvote),
                        url: Config.TopGGLink,
                        style: ButtonStyle.Link,
                    },
                    {
                        type: 2,
                        label: t("vote.cancel", locale),
                        custom_id: JSON.stringify({ c: "vote", src: "cancel", uid: author.id }),
                        emoji: parseEmoji(e.Trash),
                        style: ButtonStyle.Danger,
                    },
                ],
            }].asMessageComponents(),
        });

        async function cancel(vote: Vote | undefined | null) {
            if (!vote) return await msg.edit({ content: t("vote.no_exists", { e, locale }) });

            await client.rest.delete(Routes.channelMessage(`${vote.channelId}`, `${vote.messageId}`)).catch(() => null);
            await msg.edit({ content: t("vote.cancelling", { e, locale }) });
            await TopGGManager.deleteByUserId(author.id);
            return await msg.edit({ content: t("vote.canceled", { e, locale }) });
        }
    },
};