import loadCommands from "../commands";
import { Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import { GiveawayManager, JokempoManager, PayManager, TempcallManager } from "../managers";
import Database from "../database";

client.on(Events.ShardReady, async (shardId, unavailableGuilds) => {
    client.shardId = shardId;
    if (!socket.connected) await socket.connect();

    if (unavailableGuilds?.size) {
        const guildsIds = Array.from(unavailableGuilds);
        console.log(`${guildsIds.length} Unavailable Guilds.`);
        await Database.Guilds.deleteMany({ id: guildsIds });
    }

    return console.log("Shard", shardId, "ready");
});

client.once(Events.ClientReady, async function () {

    await Database.connect();
    discloud.rest.setToken(env.DISCLOUD_TOKEN);

    await loadCommands();
    await getGuildsAndLoadSystems();
    client.loaded = true;
    return console.log("Client ready");
});

async function getGuildsAndLoadSystems() {
    refundAllCrashGame();
    await JokempoManager.load();
    await PayManager.load();
    await TempcallManager.load();

    await Database.Guilds.find(
        { id: { $in: Array.from(client.guilds.cache.keys()) } }
    )
        .then(docs => GiveawayManager.load(docs))
        .catch(err => console.log("Error to load the giveaways", err));
}

async function refundAllCrashGame() {
    const data = await Database.Crash.find({ guildId: { $in: Array.from(client.guilds.cache.keys()) } });
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