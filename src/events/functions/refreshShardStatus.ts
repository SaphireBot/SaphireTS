import client from "../../saphire";
import socket from "../../services/api/ws";

export default async function sendShardStatus() {
    if (typeof client.shardId !== "number") return;

    if (socket.connected)
        socket.ws.volatile.send({
            type: "shardStatus",
            shardData: {
                shardId: client.shardId,
                ready: client.isReady(),
                ms: client.ws.ping || 0,
                clusterName: client.clusterName,
                guilds: client.guilds.cache.map(g => ({
                    id: g.id,
                    name: g.name,
                    icon: g.icon,
                    owner: g.ownerId === client.user!.id,
                    permissions: g.members.me?.permissions || null,
                    features: g.features
                })),
                guildsCount: client.guilds.cache.size || 0,
                emojisCount: client.emojis.cache.size || 0,
                channelsCount: client.channels.cache.size || 0,
                usersCount: client.users.cache.size || 0
            }
        });
    return;
}