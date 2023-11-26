import { Routes } from "discord.js";
import Database from "../../database";
import { VoteSchema } from "../../database/models/vote";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { WatchChange } from "../../@types/database";
import { ReminderManager } from "..";
import { randomBytes } from "crypto";

export default class TopGG {
    timeouts: Record<string, NodeJS.Timeout> = {};
    constructor() { }

    async load(guildsId: string[]) {
        this.watch();
        if (!guildsId?.length) return;

        const votes = await Database.Vote.find({ guildId: { $in: guildsId } });
        if (!votes?.length) return;

        for (const vote of votes) this.init(vote);
        return;
    }

    async init(vote?: VoteSchema) {

        if (
            !vote
            || !client.guilds.cache.has(vote.guildId!)
        ) return;

        if (vote.voted) {
            this.validate(vote);
            return;
        }

        if (!vote || this.timeouts[vote.userId!]) return;
        this.timeouts[vote.userId!] = setTimeout(() => this.delete(vote), (vote.deleteAt! - 0) - Date.now());
    }

    async delete(vote?: VoteSchema | any, keepMessage?: boolean) {
        if (!vote) return;

        if (!keepMessage)
            await client.rest.delete(
                Routes.channelMessage(vote.channelId!, vote.messageId!)
            ).catch(() => { });

        await Database.Vote.deleteMany({ userId: vote.userId });
        if (this.timeouts[vote.userId!]) clearTimeout(this.timeouts[vote.userId!]);
        delete this.timeouts[vote.userId!];
        return;
    }

    async deleteByUserId(userId: string) {
        if (!userId) return;
        const vote = await Database.Vote.findOne({ userId });
        return await this.delete(vote);
    }

    async deleteByMessageId(messageId: string) {
        if (!messageId) return;
        const vote = await Database.Vote.findOne({ messageId });
        return await this.delete(vote);
    }

    async bulkDeleteByMessageId(messagesId: string[]) {
        if (!messagesId?.length) return;
        const votes = await Database.Vote.find({ messageId: { $in: messagesId } });
        await Promise.all(votes?.map(vote => this.delete(vote)));
        return;
    }

    async deleteByChannelId(channelId: string) {
        if (!channelId) return;
        const vote = await Database.Vote.findOne({ channelId });
        return await this.delete(vote);
    }

    async deleteByGuildId(guildId: string) {
        if (!guildId) return;
        const vote = await Database.Vote.findOne({ guildId });
        return await this.delete(vote);
    }

    async validate(vote: VoteSchema) {

        await Database.editBalance(
            vote.userId!,
            {
                createdAt: new Date(),
                keywordTranslate: "vote.transactions.voted",
                method: "add",
                mode: "vote",
                type: "gain",
                value: 5000
            }
        );

        this.delete(vote, true);

        const locale = await Database.Users.findOneAndUpdate(
            { id: vote.userId! },
            { $inc: { Xp: 1000 } },
            { new: true, upsert: true }
        ).then(doc => doc.locale || "en-US").catch(() => "en-US");

        if (vote.enableReminder)
            ReminderManager.save({
                alerted: false,
                channelId: vote.channelId!,
                createdAt: new Date(),
                guildId: vote.guildId!,
                id: randomBytes(15).toString("base64url"),
                interval: 0,
                isAutomatic: true,
                lauchAt: new Date(Date.now() + (1000 * 60 * 60 * 12)),
                message: "vote.reminder",
                sendToDM: false,
                userId: vote.userId!
            });

        await client.rest.patch(
            Routes.channelMessage(
                vote.channelId!,
                vote.messageId!
            ),
            {
                body: {
                    content: t("vote.voted", { e, locale }),
                    components: [],
                    embeds: []
                }
            }
        ).catch(() => { });

    }

    watch() {

        Database.Vote.watch()
            .on("change", async (change: WatchChange) => {
                if (["insert", "update"].includes(change.operationType)) {
                    const vote = await Database.Vote.findById(change.documentKey._id);
                    return await this.init(vote?.toObject());
                }
                return;
            });

        return;
    }
}