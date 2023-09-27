import loadCommands from "../commands";
import { Events } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";
import { GiveawayManager } from "../managers";
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
    await Database.Guilds.find(
        { id: { $in: Array.from(client.guilds.cache.keys()) } }
    )
        .then(docs => GiveawayManager.load(docs))
        .catch(err => console.log("Error to load the giveaways", err));
}