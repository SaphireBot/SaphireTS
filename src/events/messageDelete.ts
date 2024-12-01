import deleteConnect4Game from "../commands/functions/connect4/delete";
import Database from "../database";
import { CrashManager, GiveawayManager, JokempoManager, PayManager, ReminderManager, TopGGManager } from "../managers";
import client from "../saphire";
import { Events } from "discord.js";
import { QuizCharactersManager } from "../structures/quiz";
import { imagesCache } from "../commands/functions/images/images";
import { payloadEmbedsColors } from "../commands/functions/embed/payload";
import messageDeleteLogs from "./functions/messageDelete.logs";

client.on(Events.MessageDelete, async message => {
    if (!message?.id) return;
    // Database.setCache(message.author?.id, message.author?.toJSON(), "user");
    await deleteByMessageId(message.id, message.guildId, message.channelId);
    await messageDeleteLogs(message);
    return;
});

client.on(Events.MessageBulkDelete, async (messages, channel) => {
    const messagesKey = Array.from(messages.keys());
    GiveawayManager.deleteMultiples(messagesKey);
    PayManager.bulkRefundByMessageId(messagesKey);
    CrashManager.bulkRefundByMessageId(messagesKey);
    ReminderManager.deleteByMessagesIds(messagesKey);
    TopGGManager.bulkDeleteByMessageId(messagesKey);
    QuizCharactersManager.removeFromCache(messagesKey);
    deleteConnect4Game(messagesKey);

    await Promise.all(
        messagesKey.map(messageId => deleteByMessageId(messageId, channel.guildId, channel.id)),
    );

    return;
});

async function deleteByMessageId(messageId: string, guildId?: string | null, channelId?: string) {
    GiveawayManager.delete(messageId);
    JokempoManager.messageDeleteEvent(messageId);
    PayManager.refundByMessageId(messageId);
    CrashManager.refundByMessageId(messageId);
    ReminderManager.deleteByMessagesIds([messageId]);
    TopGGManager.deleteByMessageId(messageId);
    QuizCharactersManager.removeFromCacheByMessageId(messageId);
    deleteConnect4Game(messageId);
    await Database.Games.delete(`Teams.${messageId}`);
    imagesCache.delete(messageId);
    delete payloadEmbedsColors[messageId];

    if (guildId && channelId) {
        await Database.Games.delete(`Elimination.${guildId}.${channelId}.${messageId}`);
        await Database.Games.delete(`Tictactoe.${guildId}.${channelId}.${messageId}`);
    }

    return;
}