import "dotenv/config";
import "source-map-support/register";
import { ShardingManager } from "discord.js";
import { execArgv, env } from "process";

const shardDataComplement = {
    discloud: {
        shardList: [0],
        totalShards: 1
    },
    localhost: {
        shardList: [0],
        totalShards: 1
    }
}[env.MACHINE];

if (!shardDataComplement) {
    console.log("NO SHARD DATA");
    process.exit();
}

const Manager = new ShardingManager("./out/index.js", Object.assign({ execArgv }, shardDataComplement));
console.log(`[Sharding Manager] Starting ${Manager.totalShards} shards...`);

Manager.spawn();