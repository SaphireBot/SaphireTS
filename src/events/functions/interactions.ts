import { MessageReaction, PartialMessageReaction, User, PartialUser, Message, PartialMessage } from "discord.js";
import client from "../../saphire";
import { t } from "../../translator";

export default async function interactionsReaction(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
) {

    let message: Message<boolean> | PartialMessage | null = reaction.message;
    if (message.partial) message = await message.fetch().catch(() => null);
    if (message?.reference?.messageId) {
        const reference = await message.channel.messages.fetch(message.reference?.messageId).catch(() => null);
        if (reference && reference.author.id === user.id) return;
    }

    if (
        !message
        || !message.editable
        || message.author.id !== client.user!.id
        || user.id === client.user!.id
        || !message.embeds?.[0]
        || !message.embeds[0]?.footer?.text?.length
        // || !message.embeds[0]?.footer?.text?.includes("Anime:")
        || message.embeds[0]?.footer?.text?.includes("GIF by Tenor")
        || message.embeds[0]?.footer?.text?.includes("|")
        || !message.content?.includes(`@${user.id}`)
        || message.interaction?.user?.id === user.id
    ) return;

    const embed = message.embeds[0].toJSON();
    embed.footer!.text += ` | ${t("interactions.recognized", { user, locale: await user.locale() })}`;
    await reaction.message.edit({ embeds: [embed] }).catch(() => { });
    return await message.reactions.removeAll().catch(() => { });
}