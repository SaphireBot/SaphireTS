import "dotenv/config";
import "source-map-support/register";
import { ShardingManager } from "discord.js";
// import { env } from "process";

// const options = {
//     discloud: {
//         shardList: [0, 1, 2],
//         totalShards: 3
//     },
//     localhost: {
//         shardList: [0],
//         totalShards: 1
//     }
// }[env.MACHINE as "localhost" | "discloud" || "localhost"];

const Manager = new ShardingManager(
    "./out/index.js",
    {
        shardList: [0],
        totalShards: 1
    }
);

console.log(`[Sharding Manager] Starting ${Manager.totalShards} shards...`);

Manager.spawn();