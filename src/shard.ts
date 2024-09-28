import "dotenv/config";
import "source-map-support/register";
import { ShardingManager } from "discord.js";
import { env, execArgv } from "process";

const Manager = new ShardingManager(
    "./out/index.js",
    {
        token: env.MACHINE === "discloud"
            ? env.SAPHIRE_DISCORD_TOKEN
            : env.CANARY_DISCORD_TOKEN,
        execArgv: execArgv
    }
);

console.log("[Sharding Manager] Starting shards...");

Manager.spawn();