import loadCommands from "../commands";
import { Events } from "discord.js";
import client from "../saphire";
import Database from "../database";
import socket from "../services/api/ws";
import { discloud } from "discloud.app";
import { env } from "process";

client.once(Events.ShardReady, async function (shardId, unavailableGuilds) {
    client.shardId = shardId;
    await socket.connect();
    await Database.connect();
    discloud.rest.setToken(env.DISCLOUD_TOKEN);
    loadCommands();

    if (unavailableGuilds?.size) {
        const guildsIds = Array.from(unavailableGuilds);
        console.log(`${guildsIds.length} Unavailable Guilds.`);
        await Database.Guilds.deleteMany({ id: guildsIds });
    }

    return console.log("Shard", shardId, "ready");
});