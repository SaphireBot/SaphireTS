import { Events, Message, MessageReaction } from "discord.js";
import client from "../saphire";
import interactionsReaction from "./functions/interactions";
import { PearlsManager } from "../managers";
import { e } from "../util/json";
import webhookRestartNotification from "./functions/webhookRestartNotification";
import status from "../commands/functions/pig/status";
import { languagesWithFlags } from "../commands/prefix/util/translate/constants.translate";
import translateByReaction from "./functions/flags.translate";
import Experience from "../managers/experience/experience";

const pigReplied = new Set<string>();

type langsFlagsKeyof = keyof typeof languagesWithFlags;

client.on(Events.MessageReactionAdd, async function (reaction, user): Promise<any> {

    if (user.bot) return;

    Experience.add(user.id, 2);

    if (reaction.partial) await reaction.fetch().catch(() => { });
    if (!reaction) return;

    const { emoji, message, count } = reaction;
    const emojiString = emoji.toString();

    if (Experience.usersToWarnAboutLevelUp.has(user.id))
        await Experience.warnLevelUp(message.channel, user);

    if (languagesWithFlags[emojiString as langsFlagsKeyof])
        await translateByReaction(reaction as MessageReaction, user);

    if (
        emojiString === e.Pig
        && message.author?.id === client.user!.id
        && !pigReplied.has(message.id)
    ) {
        pigReplied.add(message.id);
        // @ts-expect-error ignore
        message.author = user;
        return await status(message as Message<true>);
    }

    if (
        emojiString === e.Notification
        && message.author?.id === client.user?.id
        && client.rebooting?.started
    ) return await webhookRestartNotification(message);

    if (
        !PearlsManager.timeout[message.id]
        && PearlsManager.data.has(message.guildId!)
    ) {
        const data = PearlsManager.data.get(message.guildId!)!;
        if (
            data.emoji === emojiString
            && (count || 0) >= data.limit
        ) await PearlsManager.analizeBeforeSend(reaction as MessageReaction);
    }

    if (reaction?.emoji?.name === "🔄") return await interactionsReaction(reaction, user);
    return;
});