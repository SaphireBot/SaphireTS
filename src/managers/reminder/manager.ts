import { Collection, Routes } from "discord.js";
import Database from "../../database";
import client from "../../saphire";
import { Types } from "mongoose";
import { ReminderType } from "../../@types/commands";
import emit_dm from "./functions/emit_dm";
import emit from "./functions/emit";
import { keys, watch } from "./functions/watch";
import { ReminderViewerCollectors } from "../../commands/functions/reminder/view";
const requiredKeys = ["message", "userId", "id", "createdAt", "lauchAt"];
type requiredKeysType = "message" | "userId" | "id" | "createdAt" | "lauchAt";

const oneDay = 1000 * 60 * 60 * 24;
export const intervalTime = {
    1: oneDay,
    2: oneDay * 7,
    3: oneDay * 30
};

export default class ReminderManager {
    cache = new Collection<string, ReminderType>();
    over32Bits = new Collection<string, ReminderType>();

    constructor() { }

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

            this.start(data.toObject());
            continue;
        }

        if (idsToDelete.size) {
            await Database.Reminders.deleteMany({ _id: { $in: Array.from(idsToDelete) } });
            idsToDelete.clear();
        }

        this.validateOver32Bits();

        return;
    }

    set(id: string, data: ReminderType) {
        if (!id || !data) return;
        if (data._id) keys.set(data._id.toString(), id);
        this.cache.set(id, data);
    }

    validateOver32Bits(): NodeJS.Timeout {

        if (this.over32Bits.size)
            for (const reminder of this.over32Bits.toJSON()) {
                const timeRemaining = reminder.lauchAt.valueOf() - Date.now();
                if (timeRemaining < 2147483647) {
                    this.over32Bits.delete(reminder.id);
                    this.start(reminder);
                    continue;
                }
            }

        return setTimeout(() => this.validateOver32Bits(), 1000 * 60 * 60);
    }

    async execute(data: ReminderType) {
        const user = await client.users.fetch(data.userId).catch(() => null);
        if (!user) return await this.deleteAllRemindersFromThisUser(data.userId);

        return data.sendToDM ? await emit_dm(data) : await emit(data);
    }

    async revalide(reminderId: string, lauchAt: Date, alerted: boolean) {
        return await Database.Reminders.updateOne(
            { id: reminderId },
            {
                $set: { lauchAt, alerted },
                $unset: {
                    deleteAt: true,
                    messageId: true,
                    disableComponents: true
                }
            }
        )
            .catch(() => this.clear(reminderId));
    }

    async remove(reminderId: string) {
        if (!reminderId) return;
        await Database.Reminders.deleteOne({ id: reminderId });
        return;
    }

    async deleteAllReminderWithDMClose(userId: string) {
        for (const reminder of this.cache.toJSON())
            if (reminder.userId === userId && reminder.sendToDM)
                this.remove(reminder.id);
    }

    async save(data: ReminderType): Promise<true | { error: any }> {
        return new Database
            .Reminders(data)
            .save().then((): true => true)
            .catch((err) => ({ error: err }));
    }

    async start(reminder: ReminderType) {

        await this.clear(reminder.id);

        if (reminder.deleteAt) {
            this.set(reminder.id!, reminder);

            if (reminder.disableComponents) {
                const timeRemaining = reminder.disableComponents.valueOf() - Date.now();
                setTimeout(() => this.disableComponents(reminder), timeRemaining <= 0 ? 1 : timeRemaining);
            }

            const timeRemaining = reminder.deleteAt.valueOf() - Date.now();
            return setTimeout(() => this.remove(reminder.id), timeRemaining <= 0 ? 1 : timeRemaining);
        }

        if (reminder.alerted)
            return this.set(reminder.id, reminder);

        if (
            (
                reminder.sendToDM
                || !reminder.guildId
                || !reminder.channelId
            )
            && client.shardId !== 0
        ) {
            return await this.clear(reminder.id);
        }

        const timeRemaining = reminder.lauchAt.valueOf() - Date.now();

        // setTimeout limit in Node.js
        if (timeRemaining > 2147483647) {
            this.set(reminder.id, reminder);
            this.over32Bits.set(reminder.id, reminder);
            return;
        }

        reminder.timeout = setTimeout(async () => await this.execute(reminder), timeRemaining <= 1000 ? 0 : timeRemaining);

        this.set(reminder.id, reminder);
        return this.emitRefresh(reminder.id, reminder.userId);
    }

    async deleteAllRemindersFromThisUser(userId: string) {
        return await Database.Reminders.deleteMany({ userId });
    }

    async setAlert(reminderId: string, deleteAt: number, messageId: string) {

        this.over32Bits.delete(reminderId);
        const reminder = this.cache.get(reminderId);
        if (!reminder) return false;

        if (reminder.isAutomatic) {
            this.remove(reminder.id);
            return false;
        }

        if ([1, 2, 3].includes(reminder.interval)) {
            await this.revalide(
                reminder.id,
                new Date(Date.now() + intervalTime[reminder.interval as 1 | 2 | 3]),
                false
            );
            return false;
        }

        await Database.Reminders.updateOne(
            { id: reminderId },
            {
                $set: {
                    Alerted: true,
                    deleteAt,
                    messageId,
                    disableComponents: Date.now() + (1000 * 60 * 10)
                }
            }
        )
            .catch(() => { });

        this.emitRefresh(reminderId, reminder.userId);
        return true;
    }

    async disableComponents(reminder?: ReminderType) {
        if (!reminder?.channelId || !reminder?.messageId) return;

        return await client.rest.patch(
            Routes.channelMessage(reminder.channelId, reminder.messageId),
            { body: { components: [] } }
        ).catch(() => { });

    }

    async deleteByMessagesIds(messagesIds: string[]) {
        return await Database.Reminders.deleteMany({ messageId: { $in: messagesIds } });
    }

    async removeAllRemindersFromThisChannel(channelId: string) {
        return await Database.Reminders.deleteMany({ channelId });
    }

    async removeAllRemindersFromThisGuild(guildId: string) {
        return await Database.Reminders.deleteMany({ guildId });
    }

    async fetchReminderByMessageId(messageId: string): Promise<ReminderType | void> {
        if (!messageId) return;
        const reminder = await Database.Reminders.findOne({ messageId });
        return reminder?.toObject();
    }

    async snooze(reminderId: string): Promise<boolean> {
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
        ).then(() => true).catch(() => false);
    }

    async clear(reminderId: string): Promise<void> {
        if (!reminderId) return;
        const reminder = this.cache.get(reminderId);
        if (!reminder) return;

        clearTimeout(reminder.timeout);
        this.cache.delete(reminderId);
        this.over32Bits.delete(reminderId);

        for (const [objectId, key] of keys)
            if (reminderId === key) keys.delete(objectId);

        this.emitRefresh(reminder.id, reminder.userId);
        return;
    }

    async fetch(reminderId: string): Promise<ReminderType | undefined> {
        if (!reminderId) return;
        const doc = await Database.Reminders.findOne({ id: reminderId });
        return doc?.toObject();
    }

    emitRefresh(reminderId?: string, userId?: string) {
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