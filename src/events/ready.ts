import loadCommands from "../commands";
import { ActivityType, Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import {
    AutoroleManager,
    BanManager,
    GiveawayManager,
    JokempoManager,
    PayManager,
    TempcallManager,
    ReminderManager,
    RankingManager,
    AfkManager
} from "../managers";
import Database from "../database";

client.on(Events.ShardReady, async (shardId, unavailableGuilds) => {
    client.shardId = shardId;
    if (!socket.connected) await socket.connect();

    if (unavailableGuilds?.size) {
        const guildsIds = Array.from(unavailableGuilds);
        console.log(`${guildsIds.length} Unavailable Guilds.`);
        await Database.Guilds.deleteMany({ id: guildsIds });
    }

    // return console.log("Shard", shardId, "ready");
});

client.once(Events.ClientReady, async function () {

    await Database.connect();
    discloud.rest.setToken(env.DISCLOUD_TOKEN);

    await loadCommands();
    getGuildsAndLoadSystems();

    if (socket.connected)
        socket.twitch.ws.emit("guildsPreferredLocale", client.guilds.cache.map(guild => ({ guildId: guild.id, locale: guild.preferredLocale || "en-US" })));

    client.loaded = true;

    client.user?.setPresence({
        activities: [
            {
                name: "Interestelar",
                state: `Reconstrução Completa da Saphire Moon [Cluster ${client.clusterName} - Shard ${client.shardId}]`,
                type: ActivityType.Custom
            }
        ],
        afk: false,
        shardId: client.shardId,
        status: "idle"
    });

    return console.log("Shard", client.shardId, "ready");
});

async function getGuildsAndLoadSystems() {

    const guildsId = Array.from(client.guilds.cache.keys());

    refundAllCrashGame(guildsId);
    JokempoManager.load();
    PayManager.load();
    RankingManager.checkTimeoutAndLoad();

    const guildDocs = await Database.getGuilds(guildsId);

    GiveawayManager.load(guildDocs);
    TempcallManager.load(guildDocs);
    BanManager.load(guildDocs);
    ReminderManager.load(guildsId);
    AutoroleManager.load(guildDocs);
    AfkManager.load(guildsId);
    return;
}

async function refundAllCrashGame(guildsId: string[]) {
    const data = await Database.Crash.find({ guildId: { $in: guildsId } });
    if (!data.length) return;

    for await (const value of data) {
        for await (const userId of value.players) {
            await Database.editBalance(
                userId,
                {
                    createdAt: new Date(),
                    keywordTranslate: "crash.transactions.refund",
                    method: "add",
                    mode: "system",
                    type: "system",
                    value: value.value!
                }
            );
            await Database.Crash.deleteOne({ messageId: value.messageId });
        }
    }
}