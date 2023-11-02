import { AutocompleteInteraction } from "discord.js";
import socket from "../../../services/api/ws";
import { NotifierData } from "../../../@types/twitch";
export const cache = new Map<string, NotifierData[]>();

export default async function streamers(interaction: AutocompleteInteraction, value: string) {

    const { guildId } = interaction;

    if (!cache.has(guildId!)) {
        const data = await socket.twitch.getGuildData(guildId!);
        cache.set(guildId!, data || []);
        setTimeout(() => cache.delete(guildId!), 1000 * 30);
    }

    return await interaction
        .respond(
            (cache.get(guildId!) || [])
                .filter(v => "streamer" in v)
                .filter(v => v.streamer?.toLowerCase()?.includes(value?.toLocaleLowerCase())
                    || v.channelId.includes(value)
                    || v.roleId?.includes(value)
                    || v.message?.includes(value)
                )
                .map(d => ({ name: d.streamer || "Stremer no found", value: d.streamer! }))
                .slice(0, 25)
        );

}