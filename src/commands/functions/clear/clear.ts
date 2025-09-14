import { ButtonInteraction, ChatInputCommandInteraction, Message, GuildMember, TextChannel, Collection } from "discord.js";
import saveCacheOptions from "./save_options";
import execute from "./execute";

export type clearData = {
    userId: string,
    amount: number,
    members: Collection<string, GuildMember>;
    channel: TextChannel | undefined,
    bots: boolean,
    attachments: boolean,
    webhooks: boolean,
    ignoreBots: boolean,
    ignoreMembers: boolean,
    ignoreWebhooks: boolean,
    script: boolean
};
export const cache = new Map<string, clearData>();
export const cleaning = new Set<string>();

export default async function clear(
    interaction: ChatInputCommandInteraction<"cached"> | Message<true> | ButtonInteraction<"cached">,
    options?: { id: string, uid: string },
) {

    if (!options || !(interaction instanceof ButtonInteraction))
        return await saveCacheOptions(interaction as ChatInputCommandInteraction<"cached"> | Message<true>);

    return await execute(interaction);
}