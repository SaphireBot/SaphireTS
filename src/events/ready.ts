import { Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import sendShardStatus from "./functions/refreshShardStatus";
import { urls } from "../util/constants";
import Database from "../database";
import { createRedisClients } from "../database/redis";
import keeponline from "../managers/keeponline";
import { loadTranslateAutocompleteLangs } from "../structures/interaction/autocomplete/translate";
let sendShardStatusInterval: NodeJS.Timeout;

client.on(Events.ShardResume, (shardId) => {
    client.shardId = shardId;
    return sendShardStatus();
});
client.on(Events.ShardDisconnect, sendShardStatus);
client.on(Events.ShardReady, async (shardId, _) => {

    client.shardId = shardId;
    await Database.connect();
    await createRedisClients();
    // if (!client.isReady()) return;

    await socket.connect();

    if (sendShardStatusInterval) return;

    // if (unavailableGuilds?.size) {
    //     const guildsIds = Array.from(unavailableGuilds);
    //     console.log(`${guildsIds.length} Unavailable Guilds, removing from cache.`);
    //     for (const id of guildsIds)
    //         client.guilds.cache.delete(id);
    // }

    sendShardStatus();
    sendShardStatusInterval = setInterval(() => sendShardStatus(), 1000 * 10);
    return;
});

client.once(Events.ClientReady, async () => {
    discloud.rest.setToken(env.DISCLOUD_TOKEN);
    client.invite = urls.clientInvite(client.user!.id);
    keeponline();
    loadTranslateAutocompleteLangs();

    const interval = setInterval(() => {
        if (socket.twitch?.ws?.connected) {
            clearInterval(interval);
            socket.twitch?.emit("guildsPreferredLocale", client.guilds.cache.map(guild => ({ guildId: guild.id, locale: guild.preferredLocale || "en-US" })));
        }
    }, 5000);

    client.loaded = true;
    return console.log(`[Client - Shard ${client.shardId}] Ready`);
});