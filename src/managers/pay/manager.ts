import { Collection } from "discord.js";
import Pay from "../../structures/pay/pay";
import Database from "../../database";
import { WatchChange } from "../../@types/database";

export default class PayManager {
    cache = new Collection<string, Pay>();
    constructor() { }

    watch() {
        Database.Pay.watch()
            .on("change", async (change: WatchChange) => {
                if (change.operationType === "delete") {
                    const pay = this.get(change.documentKey._id.toString());
                    if (pay) {
                        pay.clearTimeout();
                        this.cache.delete(pay.messageId);
                        if (!pay.readyToValidate) await pay.refund(pay.refundKey);
                    }
                }
            });
    }

    get(_id: string) {
        return this.cache.find(p => p._id === _id);
    }

    async load(guildsId: string[]) {

        this.watch();
        if (!guildsId?.length) return;
        const paysData = await Database.Pay.find({ guildId: { $in: guildsId } });
        if (!paysData) return;

        for await (const data of paysData) {
            const pay = new Pay(data);
            const loaded = await pay.load();
            if (!loaded) continue;
            this.cache.set(data.messageId!, pay);
            continue;
        }

        return;
    }

    async getAllFromUserId(userId: string) {
        return await Database.Pay.find({
            "$or": [
                { payer: userId },
                { receiver: userId }
            ]
        });
    }

    fromPayer(userId: string) {
        return this.cache.filter(value => value.payer === userId).toJSON();
    }

    fromReceiver(userId: string) {
        return this.cache.filter(value => value.receiver === userId).toJSON();
    }

    async refundByMessageId(messageId: string) {
        return this.cache.get(messageId)?.delete("pay.transactions.unknown");
    }

    async refundByUserId(userId: string) {
        for (const pay of this.cache.values())
            if ([pay.payer, pay.receiver].includes(userId))
                pay.delete("pay.transactions.unknown");
    }

    async refundByChannelId(channelId: string) {
        for (const pay of this.cache.values())
            if (pay.channelId === channelId)
                pay.delete("pay.transactions.unknown");
    }

    async refundByGuildId(guildId: string) {
        for (const pay of this.cache.values())
            if (pay.guildId === guildId)
                pay.delete("pay.transactions.unknown");
    }

    async bulkRefundByMessageId(messagesId: string[]) {
        for (const messageId of messagesId)
            return this.cache.get(messageId)?.delete("pay.transactions.unknown");
    }

}