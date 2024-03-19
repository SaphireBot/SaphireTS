import { Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import Database from "../database";
import getGuildsAndLoadSystems from "./functions/getGuildsAndLoadSystems";
import sendShardStatus from "./functions/refreshShardStatus";
import { loadGifs } from "../commands/functions/fun/gifs";
import handler from "../structures/commands/handler";
import defineClientPresence from "./functions/defineClientPresence";

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
    client.invite = `https://discord.com/oauth2/authorize?client_id=${client.user!.id}`;

    await handler.load();
    getGuildsAndLoadSystems();
    loadGifs();
    defineClientPresence();

    if (socket.twitch?.ws?.connected)
        socket.twitch.emit("guildsPreferredLocale", client.guilds.cache.map(guild => ({ guildId: guild.id, locale: guild.preferredLocale || "en-US" })));
    client.loaded = true;

    return console.log("Shard", client.shardId, "ready");
});
