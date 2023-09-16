import "dotenv/config"
import "source-map-support/register";
import { ShardingManager } from "discord.js";
import { execArgv } from "process";

const Manager = new ShardingManager("./out/index.js", { execArgv, totalShards: 2, shardList: [0, 1] })
console.log(`[Sharding Manager] Starting ${Manager.totalShards} shards...`)

Manager.on("shardCreate", shard => console.log(`[Shard ${shard.id}] Lauched`))
Manager.spawn()