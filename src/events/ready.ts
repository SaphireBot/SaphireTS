import loadCommands from "../commands";
import { ActivityType, Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import Database from "../database";
import staffData from "../services/api/ws/funtions/staffData";
import getGuildsAndLoadSystems from "./functions/getGuildsAndLoadSystems";
import sendShardStatus from "./functions/refreshShardStatus";

client.on(Events.ShardResume, (shardId) => {
    client.shardId = shardId;
    return sendShardStatus();
});
client.on(Events.ShardDisconnect, () => sendShardStatus());
client.on(Events.ShardReady, async (shardId, unavailableGuilds) => {
    client.shardId = shardId;
    await socket.connect();

    if (unavailableGuilds?.size) {
        const guildsIds = Array.from(unavailableGuilds);
        console.log(`${guildsIds.length} Unavailable Guilds.`);
        await Database.Guilds.deleteMany({ id: guildsIds });
    }

    if (!client.isReady()) return;
    sendShardStatus();
    setInterval(() => sendShardStatus(), 1000 * 10);
    return;
});

client.once(Events.ClientReady, async function () {

    await Database.connect();
    discloud.rest.setToken(env.DISCLOUD_TOKEN);

    await loadCommands();
    getGuildsAndLoadSystems();

    socket.twitch.ws.emit("guildsPreferredLocale", client.guilds.cache.map(guild => ({ guildId: guild.id, locale: guild.preferredLocale || "en-US" })));
    if (client.shardId === 0) staffData(socket.ws);

    client.loaded = true;

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