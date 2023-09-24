import { GiveawayManager } from "../managers";
import client from "../saphire";
import { Events } from "discord.js";

client.on(Events.MessageDelete, async message => {
    if (!message?.id) return;
    GiveawayManager.delete(message.id);
});

client.on(Events.MessageBulkDelete, async (messages, _) => {
    const messagesKey = Array.from(messages.keys());
    GiveawayManager.deleteMultiples(messagesKey);
});