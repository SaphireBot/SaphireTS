import deleteConnect4Game from "../commands/slash/games/delete";
import Database from "../database";
import { CrashManager, GiveawayManager, JokempoManager, PayManager, ReminderManager, TopGGManager } from "../managers";
import client from "../saphire";
import { Events } from "discord.js";
import { QuizCharactersManager } from "../structures/quiz";

client.on(Events.MessageDelete, async message => {
    if (!message?.id) return;
    Database.setCache(message.author?.id, message.author?.toJSON(), "user");
    GiveawayManager.delete(message.id);
    JokempoManager.messageDeleteEvent(message.id);
    PayManager.refundByMessageId(message.id);
    CrashManager.refundByMessageId(message.id);
    ReminderManager.deleteByMessagesIds([message.id]);
    TopGGManager.deleteByMessageId(message.id);
    QuizCharactersManager.removeFromCacheByMessageId(message.id);
    deleteConnect4Game(message.id);
    return;
});

client.on(Events.MessageBulkDelete, async (messages, _) => {
    const messagesKey = Array.from(messages.keys());
    GiveawayManager.deleteMultiples(messagesKey);
    PayManager.bulkRefundByMessageId(messagesKey);
    CrashManager.bulkRefundByMessageId(messagesKey);
    ReminderManager.deleteByMessagesIds(messagesKey);
    TopGGManager.bulkDeleteByMessageId(messagesKey);
    QuizCharactersManager.removeFromCache(messagesKey);
    deleteConnect4Game(messagesKey);

    for (const messageId of messagesKey)
        JokempoManager.messageDeleteEvent(messageId);

    return;
});