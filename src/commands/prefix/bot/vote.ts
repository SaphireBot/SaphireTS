import { Message, Routes, time, TextDisplayBuilder } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import client from "../../../saphire";
import { TopGGManager } from "../../../managers";
import { Vote } from "../../../@types/database";
import voteEnable from "../../functions/vote/vote.enable";
import voteAwaiting from "../../functions/vote/vote.awaiting";
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

        const { userLocale: locale, author } = message;
        const msg = await message.reply({
            flags: ["IsComponentsV2"],
            components: [
                new TextDisplayBuilder({
                    content: t("vote.loading", { e, locale }),
                }),
            ],
        });
        const vote = await TopGGManager.fetcher(author.id);

        if (cancelOptionsLanguages.includes(args?.[0]?.toLowerCase() || ""))
            return await cancel(vote);

        const data = await Database.getUser(author.id) || {} as any;
        const timeDifferent = (data.Timeouts?.TopGGVote || 0) > Date.now();

        if (timeDifferent)
            return await msg.edit({
                flags: ["IsComponentsV2"],
                components: [
                    new TextDisplayBuilder({
                        content: t("vote.timeout", {
                            e,
                            locale,
                            time: time(new Date(data.Timeouts!.TopGGVote), "R"),
                            votes: data?.TopGGVotes || 0,
                        }),
                    }),
                ],
            }).catch(() => { });

        if (vote)
            if (!vote.messageUrl)
                await TopGGManager.deleteByUserId(author.id);
            else return voteEnable(message, vote, msg);

        return await voteAwaiting(
            message,
            msg,
            null,
            reminderOptionsLanguages.includes(args?.[0]?.toLowerCase() || "") || false,
        );

        async function cancel(vote: Vote | undefined | null) {
            if (!vote) return await message.reply({
                content: t("vote.no_exists", { e, locale }),
            });

            const msg = await message.edit({ content: t("vote.cancelling", { e, locale }) });

            await client.rest.delete(Routes.channelMessage(`${vote.channelId}`, `${vote.messageId}`)).catch(() => null);
            await msg.edit({ content: t("vote.cancelling", { e, locale }) });
            await TopGGManager.deleteByUserId(author.id);

            await sleep(1500);
            return await msg.delete().catch(() => { });
        }
    },
};