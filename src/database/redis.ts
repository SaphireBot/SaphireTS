import Database from ".";

export async function createRedisClients() {
    const clustersNames = ["Cache", "User", "Ranking"];
    const varNames = {
        Cache: "Redis",
        User: "UserCache",
        Ranking: "Ranking",
    };

    for await (const clusterName of clustersNames) {

        // @ts-expect-error ignore
        if (Database[varNames[clusterName]]?.isReady) continue;

        // @ts-expect-error ignore
        Database[varNames[clusterName]] = await Database.createRedisClient(clusterName, Database.RedisConnectionOptions[clusterName]);
    }
}

// export const redis = Database.createRedisClient("Cache", {
//     password: env.REDIS_USER_PASSWORD,
//     socket: {
//         host: env.REDIS_SOCKET_HOST_URL,
//         port: Number(env.REDIS_SOCKET_HOST_PORT),
//     },
// });

// export const ranking = Database.createRedisClient("Ranking", {
//     password: env.REDIS_RANKING_PASSWORD,
//     socket: {
//         host: env.REDIS_RANKING_HOST_URL,
//         port: Number(env.REDIS_RANKING_HOST_PORT),
//     },
// });

// export const userCache = Database.createRedisClient("User", {
//     password: env.REDIS_USER_CACHE_PASSWORD,
//     socket: {
//         host: env.REDIS_USER_CACHE_HOST_URL,
//         port: Number(env.REDIS_USER_CACHE_HOST_PORT),
//     },
// });