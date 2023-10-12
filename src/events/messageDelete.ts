import { CrashManager, GiveawayManager, JokempoManager, PayManager } from "../managers";
import client from "../saphire";
import { Events } from "discord.js";

client.on(Events.MessageDelete, async message => {
    if (!message?.id) return;
    GiveawayManager.delete(message.id);
    JokempoManager.messageDeleteEvent(message?.id);
    PayManager.refundByMessageId(message?.id);
    CrashManager.refundByMessageId(message?.id);
});

client.on(Events.MessageBulkDelete, async (messages, _) => {
    const messagesKey = Array.from(messages.keys());
    GiveawayManager.deleteMultiples(messagesKey);
    PayManager.bulkRefundByMessageId(messagesKey);
    CrashManager.bulkRefundByMessageId(messagesKey);

    for (const messageId of messagesKey)
        JokempoManager.messageDeleteEvent(messageId);
});