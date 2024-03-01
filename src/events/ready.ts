import { ActivityType, Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import Database from "../database";
import getGuildsAndLoadSystems from "./functions/getGuildsAndLoadSystems";
import sendShardStatus from "./functions/refreshShardStatus";
import { loadGifs } from "../commands/functions/fun/gifs";
import handler from "../structures/commands/handler";

function getShardId(shardId: number) {
    return process.env.MACHINE === "localhost" ? Math.floor(Math.random() * 5000) + 15 : shardId;
}

client.on(Events.ShardResume, (shardId) => {
    client.shardId = getShardId(shardId);
    return sendShardStatus();
});
client.on(Events.ShardDisconnect, () => sendShardStatus());
client.on(Events.ShardReady, async (shardId, unavailableGuilds) => {
    client.shardId = getShardId(shardId);
    await socket.connect();

    if (unavailableGuilds?.size) {
        const guildsIds = Array.from(unavailableGuilds);
        console.log(`${guildsIds.length} Unavailable Guilds, removing from cache.`);
        for (const id of guildsIds)
            client.guilds.cache.delete(id);
        // await Database.Guilds.deleteMany({ id: guildsIds });
    }

    if (!client.isReady()) return;
    Database.watch();
    sendShardStatus();
    setInterval(() => sendShardStatus(), 1000 * 10);
    return;
});

client.once(Events.ClientReady, async function () {
    discloud.rest.setToken(env.DISCLOUD_TOKEN);

    await handler.load();
    getGuildsAndLoadSystems();
    loadGifs();
    defineClientPresence();

    if (socket.twitch?.ws?.connected)
        socket.twitch.emit("guildsPreferredLocale", client.guilds.cache.map(guild => ({ guildId: guild.id, locale: guild.preferredLocale || "en-US" })));
    client.loaded = true;

    return console.log("Shard", client.shardId, "ready");
});

function defineClientPresence(): any {

    if (!client.user || !(typeof client.shardId !== "number"))
        return setTimeout(() => defineClientPresence(), (1000 * 60) * 2);

    try {

        client.user?.setPresence({
            activities: [
                {
                    name: "Interestelar",
                    state: `/setlang [Cluster ${client.clusterName} - Shard ${client.shardId}]`,
                    type: ActivityType.Custom
                }
            ],
            afk: false,
            shardId: client.shardId,
            status: "idle"
        });

    } catch (er) {
        setTimeout(() => defineClientPresence(), (1000 * 60) * 2);
    }

}