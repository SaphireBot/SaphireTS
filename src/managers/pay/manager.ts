import { Collection } from "discord.js";
import Pay from "../../structures/pay/pay";
import Database from "../../database";
import client from "../../saphire";

export default class PayManager {
    cache = new Collection<string, Pay>();
    constructor() { }

    async load() {

        const paysData = await Database.Pay.find({ guildId: { $in: Array.from(client.guilds.cache.keys()) } });
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

    async createdPays(userId: string) {
        return this.cache.filter(value => value.payer === userId).toJSON();
    }

    async awaitingConfirmation(userId: string) {
        return this.cache.filter(value => value.receiver === userId).toJSON();
    }

    async refundByMessageId(messageId: string) {
        return this.cache.get(messageId)?.delete(false);
    }

    async refundByChannelId(channelId: string) {
        for (const pay of this.cache.values())
            if (pay.channelId === channelId)
                pay.delete(false);
    }

    async refundByGuildId(guildId: string) {
        for (const pay of this.cache.values())
            if (pay.guildId === guildId)
                pay.delete(false);
    }

    async bulkRefund(messagesId: string[]) {
        for (const messageId of messagesId)
            return this.cache.get(messageId)?.delete(false);
    }
}