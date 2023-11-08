import { Collection, Routes } from "discord.js";
import Database from "../../database";
import client from "../../saphire";
import { Types } from "mongoose";
import { ReminderType } from "../../@types/commands";
import emit_dm from "./functions/emit_dm";
import emit from "./functions/emit";
import { keys, watch } from "./functions/watch";
const requiredKeys = ["RemindMessage", "userId", "id", "DateNow", "Time"];
type requiredKeysType = "RemindMessage" | "userId" | "id" | "DateNow" | "Time";

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

    async load(guildsId: string[], justUsersInDM?: boolean) {

        watch();
        const reminders: ReminderType[] = await Database.Reminders
            .find(
                client.shardId === 0
                    ? {}
                    : { guildId: { $in: guildsId } }
            )
            .then(docs => docs.map(doc => doc.toObject()));

        if (!reminders.length) return;

        const idsToDelete: Types.ObjectId[] = [];
        for (const data of reminders) {

            if ((requiredKeys as requiredKeysType[]).some(str => !data[str])) {
                idsToDelete.push(data._id!);
                continue;
            }

            if (data.deleteAt) {
                this.set(data.id, data);

                if (data.disableComponents) {
                    const timeRemaining = data.disableComponents - Date.now();
                    if (timeRemaining <= 0) this.disableComponents(data);
                    else setTimeout(() => this.disableComponents(data), timeRemaining);
                }

                const timeRemaining = data.deleteAt - Date.now();
                if (timeRemaining <= 0) {
                    this.remove(data.id);
                    continue;
                }

                setTimeout(() => this.remove(data.id), timeRemaining);
                continue;
            }

            if (data.Alerted) {
                this.set(data.id, data);
                continue;
            }

            this.start(data);
            continue;
        }

        if (idsToDelete.length)
            await Database.Reminders.deleteMany({ _id: { $in: idsToDelete } });

        this.validateOver32Bits();

        if (client.shardId === 0 && !justUsersInDM)
            this.load([], true);

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
                const timeRemaining = (reminder.DateNow + reminder.Time) - Date.now();
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

        if (data.sendToDM) return await emit_dm(data);
        return await emit(data);
    }

    async revalide(reminderId: string, DateNow: number, Alerted: boolean, Time: number) {
        return await Database.Reminders.findOneAndUpdate(
            { id: reminderId },
            {
                $set: {
                    DateNow,
                    Alerted,
                    Time
                }
            },
            { new: true, upsert: true }
        )
            .then(doc => this.start(doc?.toObject()))
            .catch(() => {
                this.cache.delete(reminderId);
                this.over32Bits.delete(reminderId);
            });
    }

    async remove(reminderId: string) {
        if (!reminderId) return;

        for (const [objectId, key] of keys)
            if (reminderId === key) keys.delete(objectId);

        await Database.Reminders.deleteOne({ id: reminderId });

        const reminder = this.cache.get(reminderId);
        if (!reminder) return;

        if (reminder.timeout) clearTimeout(reminder.timeout);

        this.cache.delete(reminderId);
        this.over32Bits.delete(reminderId);
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
            .save()
            .then((doc): true => {
                const reminder = doc.toObject();
                this.start(reminder as ReminderType);
                return true;
            })
            .catch((err): { error: any } => {
                console.log(err);
                return { error: err };
            });
    }

    start(reminder: ReminderType) {

        if (reminder.timeout) {
            clearTimeout(reminder.timeout);
            reminder.timeout = false;
        }

        const timeRemaining = (reminder.DateNow + reminder.Time) - Date.now();

        // setTimeout limit in Node.js
        if (timeRemaining > 2147483647) {
            this.set(reminder.id, reminder);
            this.over32Bits.set(reminder.id, reminder);
            return reminder;
        }

        reminder.timeout = setTimeout(() => this.execute(reminder), timeRemaining <= 1000 ? 0 : timeRemaining);
        this.set(reminder.id, reminder);
        return reminder;
    }

    async deleteAllRemindersFromThisUser(userId: string) {

        for (const reminder of this.cache.toJSON())
            if (reminder.userId === userId)
                this.remove(reminder.id);

        return;
    }

    async removeMany(remindersId: string[]) {
        for (const reminderId of remindersId) this.remove(reminderId);
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
            this.revalide(
                reminder.id,
                Date.now(),
                false,
                Date.now() + intervalTime[reminder.interval as 1 | 2 | 3]
            );
            return false;
        }

        const doc = await Database.Reminders.findOneAndUpdate(
            { id: reminderId },
            {
                $set: {
                    Alerted: true,
                    deleteAt,
                    messageId,
                    disableComponents: Date.now() + (1000 * 60 * 10)
                }
            },
            { new: true }
        ).catch(() => null);

        if (!doc) return false;

        this.set(reminderId, doc.toObject());
        setTimeout(() => this.disableComponents(this.cache.get(reminderId)), 1000 * 60 * 10);

        return true;
    }

    async disableComponents(reminder?: ReminderType) {
        if (!reminder) return;

        if (!reminder.ChannelId || !reminder.messageId) return;

        return await client.rest.patch(
            Routes.channelMessage(reminder.ChannelId, reminder.messageId),
            { body: { components: [] } }
        ).catch(() => { });

    }

    async deleteByMessagesIds(messagesIds: string[]) {
        for (const messageId of messagesIds)
            for (const reminder of this.cache.toJSON())
                if (reminder.messageId === messageId)
                    this.remove(reminder.id);
    }

    async removeAllRemindersFromThisChannel(channelId: string) {
        for (const reminder of this.cache.toJSON())
            if (reminder.ChannelId === channelId)
                this.remove(reminder.id);
    }

    async removeAllRemindersFromThisGuild(guildId: string) {
        for (const reminder of this.cache.toJSON())
            if (reminder.guildId === guildId)
                this.remove(reminder.id);
    }

    async fetchReminderByMessageId(messageId: string) {
        if (!messageId) return;
        return await Database.Reminders.findOne({ messageId });
    }

    async snooze(reminderId: string): Promise<boolean> {
        const reminder = await Database.Reminders.findOneAndUpdate(
            { id: reminderId },
            {
                $set: {
                    Time: 1000 * 60 * 10,
                    DateNow: Date.now(),
                    Alerted: false
                }
            },
            { new: true }
        ).catch(() => null);

        if (!reminder) return false;
        this.clear(reminderId);
        this.start(reminder.toObject());
        return true;
    }

    clear(reminderId: string) {
        if (!reminderId) return;

        for (const [objectId, key] of keys)
            if (reminderId === key) keys.delete(objectId);

        const reminder = this.cache.get(reminderId);
        if (!reminder) return;

        if (reminder.timeout) clearTimeout(reminder.timeout);
        this.cache.delete(reminderId);
        this.over32Bits.delete(reminderId);
        return;
    }

}