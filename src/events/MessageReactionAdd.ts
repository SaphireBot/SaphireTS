import { Events } from "discord.js";
import client from "../saphire";
import interactionsReaction from "./functions/interactions";
import { PearlsManager } from "../managers";
import { MessageReaction } from "discord.js";
import { e } from "../util/json";
import webhookRestartNotification from "./functions/webhookRestartNotification";

client.on(Events.MessageReactionAdd, async function (reaction, user): Promise<any> {

    if (user.bot) return;

    if (reaction.partial) await reaction.fetch().catch(() => { });
    if (!reaction) return;

    const { emoji, message, count } = reaction;

    if (
        emoji.toString() === e.Notification
        && message.author?.id === client.user?.id
        && client.rebooting?.started
    ) return await webhookRestartNotification(message);

    if (
        !PearlsManager.timeout[message.id]
        && PearlsManager.data.has(message.guildId!)
    ) {
        const data = PearlsManager.data.get(message.guildId!)!;
        if (
            data.emoji === emoji.toString()
            && (count || 0) >= data.limit
        ) await PearlsManager.analizeBeforeSend(reaction as MessageReaction);
    }

    if (reaction?.emoji?.name === "🔄") return await interactionsReaction(reaction, user);
    return;
});