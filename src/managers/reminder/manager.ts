import { Collection } from "discord.js";
import Database from "../../database";
import client from "../../saphire";
import { Types } from "mongoose";
import { ReminderType } from "../../@types/commands";
import { watch } from "./functions/watch";
import { ReminderSchemaType } from "../../database/schemas/reminder";
import Reminder from "../../structures/reminder/reminder";
import { ReminderViewerCollectors } from "../../commands/functions/reminder/view";
const requiredKeys = ["message", "userId", "id", "createdAt", "lauchAt"];
type requiredKeysType = "message" | "userId" | "id" | "createdAt" | "lauchAt";

const oneDay = 1000 * 60 * 60 * 24;
export const intervalTime = {
    0: 0,
    1: oneDay,
    2: oneDay * 7,
    3: oneDay * 30
};

export default class ReminderManager {
    cache = new Collection<string, Reminder>();
    emiting = new Set<string>();

    constructor() { }

    async new(data: ReminderSchemaType | ReminderType) {
        return await new Reminder(data).load();
    }

    async load(guildsId: string[]) {
        watch();

        const reminders = await Database.Reminders
            .find(
                client.shardId === 0
                    ? {
                        $or: [
                            { guildId: { $in: guildsId } },
                            { sendToDM: true },
                            { guildId: null },
                            { channelId: null }
                        ]
                    }
                    : { guildId: { $in: guildsId } }
            )
            .catch(() => {
                console.log("Reminder Error to collector reminders");
                process.exit(0);
            });

        if (!reminders.length) return;

        const idsToDelete = new Set<Types.ObjectId>();
        for (const data of reminders) {

            if ((requiredKeys as requiredKeysType[]).some(str => !data[str])) {
                idsToDelete.add(data._id!);
                continue;
            }

            new Reminder(data).load();
            continue;
        }

        if (idsToDelete.size) {
            await Database.Reminders.deleteMany({ _id: { $in: Array.from(idsToDelete) } });
            idsToDelete.clear();
        }

        return;
    }

    async delete(reminderId: string) {
        return await Database.Reminders.deleteOne({ id: reminderId });
    }

    get(reminderId: string) {
        return this.cache.get(reminderId);
    }

    async snooze(reminderId: string): Promise<boolean> {

        const reminder = this.get(reminderId);
        if (reminder) return await reminder.snooze();

        return await Database.Reminders.updateOne(
            { id: reminderId },
            {
                $set: {
                    lauchAt: new Date(Date.now() + (1000 * 60 * 10)),
                    alerted: false
                },
                $unset: {
                    deleteAt: true,
                    disableComponents: true,
                    messageId: true
                }
            }
        )
            .then(() => true)
            .catch(() => false);
    }

    async move(reminderId: string, guildId: string, channelId: string | undefined): Promise<boolean | Error> {
        if (!reminderId || !guildId || !channelId) return false;

        const reminder = this.get(reminderId);
        if (reminder) return await reminder.move(guildId, channelId);

        return await Database.Reminders.updateOne(
            { id: reminderId },
            { $set: { guildId, channelId } }
        )
            .then(() => true)
            .catch(er => er);
    }

    async save(data: ReminderType): Promise<true | { error: any }> {
        return new Database
            .Reminders(data)
            .save().then((): true => true)
            .catch((err) => ({ error: err }));
    }

    async deleteAllRemindersFromThisUser(userId: string) {
        if (!userId) return;
        return await Database.Reminders.deleteMany({ userId });
    }

    async deleteByMessagesIds(messagesIds: string[]) {
        if (!messagesIds?.length) return;
        return await Database.Reminders.deleteMany({ messageId: { $in: messagesIds } });
    }

    async removeAllRemindersFromThisChannel(channelId: string) {
        if (!channelId) return;
        return await Database.Reminders.deleteMany({ channelId });
    }

    async theUserLeaveFromThisGuild(guildId: string, userId: string) {
        if (!guildId || !userId) return;
        const remindersId = this.cache.filter(rm => rm.guildId === guildId && rm.userId === userId).map(rm => rm.id);
        if (remindersId.length)
            return await Database.Reminders.updateMany(
                { id: { $in: remindersId } },
                {
                    $set: {
                        sendToDM: true,
                        channelId: null,
                        guildId: null
                    }
                }
            );
    }

    async removeAllRemindersFromThisGuild(guildId: string) {
        if (!guildId) return;
        return await Database.Reminders.deleteMany({ guildId });
    }

    async fetchReminderByMessageId(messageId: string): Promise<Reminder | ReminderType | void> {
        if (!messageId) return;

        const rm = this.cache.find(r => r.messageId === messageId);
        if (rm) return rm;

        const reminder = await Database.Reminders.findOne({ messageId });
        return reminder?.toObject();
    }

    async fetch(reminderId: string): Promise<ReminderType | undefined> {
        if (!reminderId) return;
        const doc = await Database.Reminders.findOne({ id: reminderId });
        return doc?.toObject();
    }

    refreshCollectors(reminderId: string, userId: string) {
        if (!reminderId && !userId) return;
        for (const [key, collector] of ReminderViewerCollectors)
            if (
                userId && key.includes(userId)
                || reminderId && key.includes(reminderId)
            )
                collector.emit("refresh", 1);
        return;
    }

}