import { env } from "process";
import { createClient } from "redis";
import client from "../saphire";

const redis = createClient({
    password: env.REDIS_USER_PASSWORD,
    socket: {
        host: env.REDIS_SOCKET_HOST_URL,
        port: Number(env.REDIS_SOCKET_HOST_PORT)
    }
});

redis.on("error", err => console.log(`[Shard ${client.shardId}]`, "REDIS ERROR", err));
redis.connect();
export default redis;