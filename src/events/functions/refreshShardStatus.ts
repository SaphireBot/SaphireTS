import { PermissionsBitField, BaseGuild, Collection, Guild } from "discord.js";
import client from "../../saphire";
import socket from "../../services/api/ws";
type guildStatus = {
    id: string
    name: string
    icon: string | null
    permissions: Readonly<PermissionsBitField> | null
    features: BaseGuild["features"]
};
export const guildsShardsStatus = new Collection<string, guildStatus>();

export function defineGuildStatus(guild: Guild) {
    guildsShardsStatus.set(guild.id, {
        features: guild.features,
        icon: guild.icon,
        id: guild.id,
        name: guild.name,
        permissions: guild.members.me?.permissions || null,
    });
}

export default async function sendShardStatus() {
    if (typeof client.shardId !== "number") return;

    if (!guildsShardsStatus.size)
        for (const guild of client.guilds.cache.values())
            defineGuildStatus(guild);

    if (socket.connected)
        socket.ws.volatile.send({
            type: "shardStatus",
            shardData: {
                shardId: client.shardId,
                ready: client.isReady(),
                ms: client.ws.ping || 0,
                clusterName: client.clusterName,
                guilds: guildsShardsStatus.toJSON(),
                guildsCount: client.guilds.cache.size || 0,
                emojisCount: client.emojis.cache.size || 0,
                channelsCount: client.channels.cache.size || 0,
                usersCount: client.users.cache.size || 0
            }
        });
    return;
}