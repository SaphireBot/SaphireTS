import Crash from "../../structures/crash/crash";

export default class CrashManager {
    declare cache: Map<string, Crash>;

    constructor() {
        this.cache = new Map<string, Crash>();
    }

    async refundByMessageId(messageId: string) {
        const crash = Array.from(this.cache.values()).find(cr => cr.messageId === messageId);
        if (!crash) return;
        return await crash.bulkRefund();
    }

    async bulkRefundByMessageId(messagesId: string[]) {
        for (const messageId of messagesId) {
            const crash = this.cache.get(messageId);
            if (!crash) continue;
            crash.bulkRefund();
        }
        return;
    }

    async bulkRefundByChannelId(channelId: string) {
        for (const crash of this.cache.values()) {
            if (crash?.channelId !== channelId) continue;
            crash.bulkRefund();
        }
        return;
    }

    async bulkRefundByGuildId(guildId: string) {
        for (const crash of this.cache.values()) {
            if (crash?.guildId !== guildId) continue;
            crash.bulkRefund();
        }
        return;
    }
}