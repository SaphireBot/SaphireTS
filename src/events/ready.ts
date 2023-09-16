import { Events } from "discord.js";
import client from "../saphire";
import Database from "../database";
import { loadCommands } from "../commands";

client.on(Events.ShardReady, async function (shardId, unavailableGuilds) {
    client.shardId = shardId;
    await Database.connect();
    loadCommands();

    if (unavailableGuilds?.size) {
        const guildsIds = Array.from(unavailableGuilds);
        console.log(`${guildsIds.length} Unavailable Guilds.`);
        await Database.Guilds.deleteMany({ id: guildsIds });
    }

    console.log("Shard", shardId, "ready");
});