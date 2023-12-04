import { Message, Colors, parseEmoji, ButtonStyle, Routes } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { Config } from "../../../util/constants";
import { VoteSchemaType } from "../../../database/schemas/vote";
import client from "../../../saphire";
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
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {

        const { userLocale: locale, author, channelId, guildId } = message;
        const msg = await message.reply({ content: t("vote.loading", { e, locale }) });
        const vote = await Database.Vote.findOne({ userId: author.id });

        if (cancelOptionsLanguages.includes(args?.[0]?.toLowerCase() || ""))
            return await cancel(vote);

        if (vote)
            return await msg.edit({
                content: t("vote.your_message_vote", {
                    e,
                    locale,
                    link: vote.messageUrl
                })
            });

        const document = await new Database.Vote({
            channelId,
            guildId,
            messageId: msg.id,
            messageUrl: msg.url,
            userId: author.id,
            deleteAt: Date.now() + (1000 * 60 * 60),
            enableReminder: reminderOptionsLanguages.includes(args?.[0]?.toLowerCase() || ""),
            voted: false
        }).save().catch(() => null);

        return await msg.edit({
            content: document ? null : t("vote.error_to_create", { e, locale }),
            embeds: document
                ? [{
                    color: Colors.Blue,
                    title: `${e.topgg} Top.GG Bot List`,
                    description: t("vote.waiting_vote", { e, locale })
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
                        style: ButtonStyle.Link
                    },
                    {
                        type: 2,
                        label: t("vote.cancel", locale),
                        custom_id: JSON.stringify({ c: "vote", uid: author.id }),
                        emoji: parseEmoji(e.Trash),
                        style: ButtonStyle.Danger
                    }
                ]
            }].asMessageComponents()
        });

        async function cancel(vote: VoteSchemaType | undefined | null) {
            if (!vote)
                return await msg.edit({ content: t("vote.no_exists", { e, locale }) });

            await client.rest.delete(Routes.channelMessage(`${vote.channelId}`, `${vote.messageId}`)).catch(() => null);
            await msg.edit({ content: t("vote.cancelling", { e, locale }) });
            await Database.Vote.deleteMany({ userId: author.id });
            return await msg.edit({ content: t("vote.canceled", { e, locale }) });
        }
    }
};