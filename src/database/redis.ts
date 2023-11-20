import { env } from "process";
import { createClient } from "redis";
import client from "../saphire";

export const redis = createClient({
    password: env.REDIS_USER_PASSWORD,
    socket: {
        host: env.REDIS_SOCKET_HOST_URL,
        port: Number(env.REDIS_SOCKET_HOST_PORT)
    }
});
redis.on("error", err => console.log(`[Shard ${client.shardId}]`, "REDIS CACHE ERROR", err));
// redis.on("connect", () => console.log("Redis Cache Connected"));
redis.connect();

export const ranking = createClient({
    password: env.REDIS_RANKING_PASSWORD,
    socket: {
        host: env.REDIS_RANKING_HOST_URL,
        port: Number(env.REDIS_RANKING_HOST_PORT)
    }
});
ranking.on("error", err => console.log(`[Shard ${client.shardId}]`, "REDIS RANKING ERROR", err));
// ranking.on("connect", () => console.log("Redis Ranking Connected"));
ranking.connect();

export const userCache = createClient({
    password: env.REDIS_USER_CACHE_PASSWORD,
    socket: {
        host: env.REDIS_USER_CACHE_HOST_URL,
        port: Number(env.REDIS_USER_CACHE_HOST_PORT)
    }
});
userCache.on("error", err => console.log(`[Shard ${client.shardId}]`, "REDIS USER CACHE ERROR", err));
// ranking.on("connect", () => console.log("Redis Ranking Connected"));
userCache.connect();