import loadCommands from "../commands";
import { ActivityType, Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import Database from "../database";
import getGuildsAndLoadSystems from "./functions/getGuildsAndLoadSystems";
import sendShardStatus from "./functions/refreshShardStatus";
import { loadGifs } from "../commands/functions/fun/gifs";
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
        console.log(`${guildsIds.length} Unavailable Guilds.`);
        await Database.Guilds.deleteMany({ id: guildsIds });
    }

    if (!client.isReady()) return;
    Database.watch();
    sendShardStatus();
    setInterval(() => sendShardStatus(), 1000 * 10);
    return;
});

client.once(Events.ClientReady, async function () {
    discloud.rest.setToken(env.DISCLOUD_TOKEN);

    await loadCommands();
    getGuildsAndLoadSystems();
    loadGifs();

    socket.twitch.emit("guildsPreferredLocale", client.guilds.cache.map(guild => ({ guildId: guild.id, locale: guild.preferredLocale || "en-US" })));
    client.loaded = true;

    if (process.env.MACHINE !== "localhost")
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

    return console.log("Shard", client.shardId, "ready");
});