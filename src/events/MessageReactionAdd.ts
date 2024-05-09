import { Events } from "discord.js";
import client from "../saphire";
import interactionsReaction from "./functions/interactions";
import { PearlsManager } from "../managers";
import { MessageReaction } from "discord.js";

client.on(Events.MessageReactionAdd, async function (reaction, user): Promise<any> {

    if (user.bot) return;

    if (reaction.partial) await reaction.fetch().catch(() => { });
    if (!reaction) return;

    const { emoji, message, count } = reaction;

    if (
        !PearlsManager.timeout[message.id]
        && PearlsManager.data.has(message.guildId!)
    ) {
        const data = PearlsManager.data.get(message.guildId!)!;
        if (
            data.emoji === emoji.toString()
            && (count || 0) >= data.limit
        ) return await PearlsManager.analizeBeforeSend(reaction as MessageReaction);
    }

    if (reaction?.emoji?.name === "🔄") return await interactionsReaction(reaction, user);
    return;
});