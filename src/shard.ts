import "dotenv/config";
import "source-map-support/register";
import { ShardingManager } from "discord.js";
import { execArgv } from "process";

const Manager = new ShardingManager("./out/index.js", { execArgv });
console.log(`[Sharding Manager] Starting ${Manager.totalShards} shards...`);

Manager.on("shardCreate", shard => console.log("Sharding Manager", `Shard ${shard.id}`, "was created"));
Manager.spawn();