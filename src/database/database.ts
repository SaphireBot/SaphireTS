import Schemas from "./schemas";
import client from "../saphire";
import { ClientSchemaType as ClientSchema } from "./schemas/client";
import { GuildSchemaType as GuildSchema } from "./schemas/guild";
import { TransactionsType } from "../@types/commands";
import socket from "../services/api/ws";
import { UserSchemaType as UserSchema } from "./schemas/user";
import { Collection } from "discord.js";
import { MercadoPagoPaymentSchema } from "./schemas/mercadopago";
import { QuickDB } from "quick.db";
import { WatchChange } from "../@types/database";
import Mongoose, { Types } from "mongoose";
import handler from "../structures/commands/handler";
import { env } from "process";
import feedbackAfterRestart from "../events/functions/restart.feedback";
import getGuildsAndLoadSystems from "../events/functions/getGuildsAndLoadSystems";
import { setTimeout as sleep } from "timers/promises";
import { createClient, RedisClientOptions, RedisClientType } from "redis";

type BalanceData = { balance: number, position: number };

export default class Database extends Schemas {
    prefixes = new Map<string, string[]>();
    Cache = new QuickDB({ filePath: "sqlite/cache.sqlite" });
    QuizCache = new QuickDB({ filePath: "sqlite/quiz.sqlite" });
    Games = new QuickDB({ filePath: "sqlite/games.sqlite" });

    declare Redis: RedisClientType | undefined;
    declare Ranking: RedisClientType | undefined;
    declare UserCache: RedisClientType | undefined;

    InMemoryTimer = new Map<string, NodeJS.Timeout>();

    MongooseUri = env.MACHINE === "discloud"
        ? env.SAPHIRE_DATABASE_LINK_CONNECTION
        : env.CANARY_DATABASE_LINK_CONNECTION;

    RedisConnectionOptions = {
        Cache: {
            password: env.REDIS_USER_PASSWORD,
            socket: {
                host: env.REDIS_SOCKET_HOST_URL,
                port: Number(env.REDIS_SOCKET_HOST_PORT),
            },
        },
        User: {
            password: env.REDIS_USER_CACHE_PASSWORD,
            socket: {
                host: env.REDIS_USER_CACHE_HOST_URL,
                port: Number(env.REDIS_USER_CACHE_HOST_PORT),
            },
        },
        Ranking: {
            password: env.REDIS_RANKING_PASSWORD,
            socket: {
                host: env.REDIS_RANKING_HOST_URL,
                port: Number(env.REDIS_RANKING_HOST_PORT),
            },
        },
    };

    headersAuthorization = {
        authorization: env.APIV2_AUTHORIZATION_KEY,
        "Content-Type": "application/json",
    };

    declare _initialLoaded: boolean;
    declare _primaryBoost: boolean;

    declare _saphireClusterReconnected: boolean;
    declare _saphireClusterConnection: Mongoose.Connection | undefined;
    saphireClusterConnection = this.saphireCluster();

    declare _gameClusterConnection: Mongoose.Connection | undefined;
    declare _gameClusterReconnected: boolean;
    gameClusterConnection = this.gameCluster();

    declare _recordClusterConnection: Mongoose.Connection | undefined;
    declare _recordClusterReconnected: boolean;
    recordClusterConnection = this.recordCluster();

    // Saphire Models
    Guilds = this.saphireClusterConnection.model("Guilds", this.GuildSchema);
    Users = this.saphireClusterConnection.model("Users", this.UserSchema);
    Client = this.saphireClusterConnection.model("Client", this.ClientSchema);
    Blacklist = this.saphireClusterConnection.model("Blacklist", this.BlacklistSchema);
    Twitch = this.saphireClusterConnection.model("Twitch", this.TwitchSchema);
    Reminders = this.saphireClusterConnection.model("Reminders", this.ReminderSchema);
    Commands = this.saphireClusterConnection.model("Commands", this.CommandSchema);
    Afk = this.saphireClusterConnection.model("Afk", this.AfkSchema);

    // // Bet Game Models
    Jokempo = this.gameClusterConnection.model("Jokempo", this.JokempoSchema);
    Pay = this.gameClusterConnection.model("Pay", this.PaySchema);
    Crash = this.gameClusterConnection.model("Crash", this.CrashSchema);
    Race = this.gameClusterConnection.model("Race", this.RaceSchema);
    Connect4 = this.gameClusterConnection.model("Connect4", this.Connect4Schema);
    Battleroyale = this.gameClusterConnection.model("Battleroyale", this.BattleroyaleSchema);
    CharactersCache = this.gameClusterConnection.model("CharacterCache", this.CharacterSchema);
    Characters = this.gameClusterConnection.model("Character", this.CharacterSchema);

    // // Records
    Payments = this.recordClusterConnection.model("MercadoPago", MercadoPagoPaymentSchema);

    constructor() {
        super();
    }

    async connect(): Promise<void> {

        if (this._primaryBoost) return;
        this._primaryBoost = true;

        await Promise.all(
            [
                this.saphireCluster(),
                this.gameCluster(),
                this.recordCluster(),
            ],
        );
    }

    saphireCluster(): Mongoose.Connection {

        if (this._saphireClusterConnection) return this._saphireClusterConnection;

        try {

            const connection = Mongoose.createConnection(this.MongooseUri);
            this._saphireClusterConnection = connection;

            connection.on("connected", () => {
                const interval = setInterval(async () => {
                    if (typeof client.shardId === "number") {
                        clearInterval(interval);
                        console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Connection completed`);
                        return;
                    }
                }, 1000);
            });

            connection.on("open", async () => {
                if (!this._initialLoaded) {
                    const interval = setInterval(() => {
                        if (typeof client.shardId === "number") {
                            clearInterval(interval);
                            console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Connection Opened... Loading Systems...`);
                        }
                    }, 500);
                }
                if (this._initialLoaded) console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Connection Reopened`);
                const interval = setInterval(async () => {

                    if (this._initialLoaded) {
                        clearInterval(interval);
                        return;
                    }

                    if (client.isReady() && typeof client.shardId === "number") {
                        clearInterval(interval);
                        this.watch();
                        await handler.load();
                        await getGuildsAndLoadSystems();
                        this._initialLoaded = true;
                        console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Watcher and Guild Systems loading inicialized`);
                        return;
                    }
                }, 2000);
                return await feedbackAfterRestart();
            });

            connection.on("disconnected", () => {
                console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Connection Disconnected`);

                setTimeout(async () => {

                    if (!this._saphireClusterReconnected) {
                        this._saphireClusterReconnected = false;
                        return;
                    }

                    this._saphireClusterConnection = undefined;
                    await sleep(1000);
                    return this.saphireCluster();
                }, 5000);
            });

            connection.on("reconnected", () => {
                this._saphireClusterReconnected = true;
                console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Connection Reconnected`);
            });

            connection.on("disconnecting", () => {
                this._saphireClusterConnection = undefined;
                this._saphireClusterReconnected = false;
                console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Disconnecting...`);
            });

            connection.on("close", () => console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Connection Closed`));

            connection.on("error", async (error: Error) => {
                console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Error`, error);
            });

            return connection;
        } catch (error) {
            console.log(`[Mongoose Saphire Cluster - Shard ${client.shardId}] Error`, error);
            process.exit(1);
        }

    }

    gameCluster(): Mongoose.Connection {

        if (this._gameClusterConnection) return this._gameClusterConnection;

        try {

            const connection = Mongoose.createConnection(env.DATABASE_BET_LINK_CONNECTION);
            this._gameClusterConnection = connection;

            connection.on("connected", () => {
                const interval = setInterval(async () => {
                    if (typeof client.shardId === "number") {
                        clearInterval(interval);
                        console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Connection completed`);
                        return;
                    }
                }, 1000);
            });

            connection.on("open", async () => {
                const interval = setInterval(async () => {
                    if (client.isReady() && typeof client.shardId === "number") {
                        clearInterval(interval);
                        console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Connection Opened`);
                        return;
                    }
                }, 2000);
            });

            connection.on("disconnected", () => {
                console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Connection Disconnected`);

                setTimeout(async () => {

                    if (!this._gameClusterReconnected) {
                        this._gameClusterReconnected = false;
                        return;
                    }

                    this._gameClusterConnection = undefined;
                    await sleep(1000);
                    return this.gameCluster();
                }, 5000);
            });

            connection.on("reconnected", () => {
                this._gameClusterReconnected = true;
                console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Connection Reconnected`);
            });

            connection.on("disconnecting", () => {
                this._gameClusterConnection = undefined;
                this._gameClusterReconnected = false;
                console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Disconnecting...`);
            });

            connection.on("close", () => console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Connection Closed`));

            connection.on("error", async (error: Error) => {
                console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Error`, error);
            });

            return connection;
        } catch (error) {
            console.log(`[Mongoose Game Cluster - Shard ${client.shardId}] Error`, error);
            process.exit(1);
        }

    }

    recordCluster(): Mongoose.Connection {

        if (this._recordClusterConnection) return this._recordClusterConnection;

        try {

            const connection = Mongoose.createConnection(env.DATABASE_RECORD_LINK_CONNECTION);
            this._recordClusterConnection = connection;

            connection.on("connected", () => {
                const interval = setInterval(async () => {
                    if (typeof client.shardId === "number") {
                        clearInterval(interval);
                        console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Connection completed`);
                        return;
                    }
                }, 1000);
            });

            connection.on("open", async () => {
                const interval = setInterval(async () => {
                    if (client.isReady() && typeof client.shardId === "number") {
                        clearInterval(interval);
                        console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Connection Opened`);
                        return;
                    }
                }, 2000);
            });

            connection.on("disconnected", () => {
                console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Connection Disconnected`);

                setTimeout(async () => {

                    if (!this._recordClusterReconnected) {
                        this._recordClusterReconnected = false;
                        return;
                    }

                    this._recordClusterConnection = undefined;
                    await sleep(1000);
                    return this.recordCluster();
                }, 5000);
            });

            connection.on("reconnected", () => {
                this._recordClusterReconnected = true;
                console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Connection Reconnected`);
            });

            connection.on("disconnecting", () => {
                this._recordClusterConnection = undefined;
                this._recordClusterReconnected = false;
                console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Disconnecting...`);
            });

            connection.on("close", () => console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Connection Closed`));

            connection.on("error", async (error: Error) => {
                console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Error`, error);
            });

            return connection;
        } catch (error) {
            console.log(`[Mongoose Record Cluster - Shard ${client.shardId}] Error`, error);
            process.exit(1);
        }

    }

    async createRedisClient(clusterName: "User" | "Cache" | "Ranking", options: RedisClientOptions): Promise<RedisClientType> {
        const redisClient = createClient(options);
        redisClient.on("error", (err) => {
            if (err?.message === "Connection timeout") return setTimeout(() => redisClient.connect().catch(() => { }), 1000 * 5);
            return console.log(`[Redis - Shard ${client.shardId}] ${clusterName} Cluster Error`, err);
        });
        redisClient.on("connect", () => console.log(`[Redis - Shard ${client.shardId}] ${clusterName} Cluster Connected`));
        await redisClient.connect();

        let reconnect = false;

        redisClient.on("reconnect", () => {
            reconnect = true;
            console.log(`[Redis - Shard ${client.shardId}] ${clusterName} Cluster Reconnected`);
        });

        redisClient.on("disconnect", async () => {
            console.log(`[Redis - Shard ${client.shardId}] ${clusterName} Cluster Disconnected`);

            await sleep(15000);
            if (reconnect) {
                reconnect = false;
                return;
            }

            this[
                {
                    Cache: "Redis",
                    User: "UserCache",
                    Ranking: "Ranking",
                }[clusterName] as "Redis" | "UserCache" | "Ranking"
            ] = await this.createRedisClient(clusterName, options);
        });

        return redisClient as RedisClientType;
    }

    async flushAll() {
        await this.Redis?.flushAll();
        await this.Ranking?.flushAll();
        await this.UserCache?.flushAll();
        await this.Cache.deleteAll();

        for (const [id, timeout] of this.InMemoryTimer.entries()) {
            clearTimeout(timeout);
            this.InMemoryTimer.delete(id);
        }

        return true;
    }

    async removeFromCache(id: string, _id?: string | Types.ObjectId | void) {
        if (!id) return;
        clearTimeout(this.InMemoryTimer.get(id));
        this.InMemoryTimer.delete(id);
        await this.Cache.delete(id);
        await this.Cache.delete(`_id.${this.getObjectIdStringfy(_id)}`);
        return;
    }

    async watch() {

        this.Client.watch()
            .on("change", async (change: WatchChange) => {

                if (["insert", "update"].includes(change.operationType)) {
                    const document = await this.Client.findOne({ id: client.user?.id });
                    if (document) {
                        handler.setBlockCommands(document?.BlockedCommands || []);

                        if (document.rebooting) {
                            client.rebooting = {
                                webhooks: document.rebooting?.webhooks?.toObject() || [],
                                reason: document.rebooting?.reason || "No reason given",
                                started: document.rebooting?.started || false,
                            };
                        } else client.rebooting = {};

                        if (client.shardId !== 0) return;
                        return await this.setCache(client.user!.id, document.toObject());
                    }
                }

                if (change.operationType === "delete") {
                    const _id = await this.Cache.get(`_id.${change.documentKey._id.toString()}`);
                    handler.blocked.clear();
                    if (client.shardId !== 0) return;
                    if (_id) return await this.removeFromCache(_id);
                }

                return;
            });

        if (client.shardId !== 0) return;
        await this.Cache.deleteAll();
        this.Users.watch()
            .on("change", async (change: WatchChange) => {

                if (["insert", "update"].includes(change.operationType)) {
                    const document = await this.Users.findById(change.documentKey._id);
                    if (document) await this.setCache(document.id, document.toObject());
                }

                if (change.operationType === "delete") {
                    const _id = await this.Cache.get(`_id.${change.documentKey._id.toString()}`);
                    if (_id) return await this.removeFromCache(_id);
                }

                return;
            });

        this.Guilds.watch()
            .on("change", async (change: WatchChange | undefined) => {
                if (!change) return;
                if (["insert", "update"].includes(change.operationType)) {
                    const document = await this.Guilds.findById(change.documentKey._id);
                    if (document) {
                        await this.setCache(document.id, document.toObject());
                        client.channelsCommandBlock[document.id] = new Set(document.ChannelsCommandBlock);
                    };
                }

                if (change.operationType === "delete") {
                    const _id = await this.Cache.get(`_id.${change.documentKey._id.toString()}`);
                    if (_id) return await this.removeFromCache(_id);
                }

                return;
            });

        return;
    }

    ping = {
        SaphireCluster: async () => this.saphireClusterConnection?.db?.admin()?.ping(),
        BetCluster: async () => this.gameClusterConnection?.db?.admin()?.ping(),
        RecordCluster: async () => this.recordClusterConnection?.db?.admin()?.ping(),
    };

    async getPrefix({ guildId, userId }: { guildId?: string, userId?: string }): Promise<string[]> {

        if (!guildId && !userId) return client.defaultPrefixes;

        if (guildId && !userId) {
            const prefixes = this.prefixes.get(guildId) || [];
            if (prefixes.length) return prefixes;
            const response = (await this.getGuild(guildId))?.Prefixes || [];
            if (!response.length) response.push(...client.defaultPrefixes);
            this.prefixes.set(guildId, response);
            return response;
        }

        if (!guildId && userId) {
            const prefixes = this.prefixes.get(userId) || [];
            if (prefixes.length) return prefixes;
            const response = (await this.getUser(userId))?.Prefixes || [];
            if (!response.length) response.push(...client.defaultPrefixes);
            this.prefixes.set(userId, response);
            return response;
        }

        const prefixesUser = this.prefixes.get(userId!) || [];
        const prefixesGuild = this.prefixes.get(guildId!) || [];

        if (!prefixesUser.length) {
            const prefixes = (await this.getUser(userId!))?.Prefixes || [];
            if (!prefixes.length) prefixes.push(...client.defaultPrefixes);
            this.prefixes.set(userId!, prefixes);
            prefixesUser.push(...prefixes);
        }

        if (!prefixesGuild.length) {
            const prefixes = (await this.getGuild(guildId!))?.Prefixes || [];
            if (!prefixes.length) prefixes.push(...client.defaultPrefixes);
            this.prefixes.set(guildId!, prefixes);
            prefixesGuild.push(...prefixes);
        }

        return Array.from(
            new Set(
                [
                    prefixesUser,
                    prefixesGuild,
                ].flat(),
            ),
        ).filter(Boolean);

    }

    async getGuild(guildId: string): Promise<GuildSchema> {
        if (!guildId) return { id: guildId } as GuildSchema;

        const cache = await this.Cache.get(guildId) as GuildSchema;
        if (cache) {
            if (!this.InMemoryTimer.has(guildId))
                this.InMemoryTimer.set(
                    guildId,
                    setTimeout(async () => this.removeFromCache(guildId, cache._id), (1000 * 60) * 60),
                );
            return cache;
        }

        const data = await this.Guilds.findOne({ id: guildId });
        if (data) {
            this.setCache(guildId, data.toObject());
            return data;
        }

        return await new this.Guilds({ id: guildId })
            .save()
            .then(doc => {
                const document = doc?.toObject();
                if (document) this.setCache(guildId, document);
                return document || { id: guildId } as GuildSchema;
            })
            .catch(err => {
                console.log("Guilds - asd4asd4asd54", err);
                return { id: guildId } as GuildSchema;
            });
    }

    async getGuilds(guildsIds: string[]): Promise<GuildSchema[]> {
        if (!guildsIds?.length) return [];
        return await Promise.all(guildsIds.map(guildId => this.getGuild(guildId)));
    }

    async getUser(userId: string): Promise<UserSchema> {
        if (!userId) return { id: userId } as UserSchema;

        const cache = await this.Cache.get(userId) as UserSchema;
        if (cache) {
            if (!this.InMemoryTimer.has(userId))
                this.InMemoryTimer.set(
                    userId,
                    setTimeout(async () => this.removeFromCache(userId, cache._id), 1000 * 60 * 60),
                );
            return cache;
        }

        const data = await this.Users.findOne({ id: userId });
        if (data) {
            this.setCache(userId, data.toObject());
            return data;
        }

        if (userId !== client.user!.id)
            return await new this.Users({ id: userId })
                .save()
                .then(doc => {
                    const document = doc?.toObject();
                    if (document) this.setCache(userId, document);
                    return document || { id: userId } as UserSchema;
                })
                .catch(err => {
                    console.log("New User Error", err);
                    return { id: userId } as UserSchema;
                });

        return { id: userId } as UserSchema;

    }

    async getUsers(usersId: string[]): Promise<UserSchema[] | []> {
        if (!usersId?.length) return [];
        return await Promise.all(usersId.map(userId => this.getUser(userId)));
    }

    async getBlockCommands() {
        const data = await this.Client.findOne({ id: client.user!.id });
        const blockedCommands = (data?.BlockedCommands || []) as { cmd: string, error: string }[];
        return blockedCommands;
    }

    getObjectIdStringfy(id?: Types.ObjectId | string | void): string | void {
        if (!id) return;
        if (typeof id === "string") return id;
        if (id.toString) return id.toString();
        return;
    }

    async setCache(key: any, data: any, time?: number) {
        if (
            !key
            || !data
            || (time && typeof time !== "number")
            || client.shard?.id !== 0
        ) return;

        const objectId = this.getObjectIdStringfy(data?._id as Types.ObjectId | string | undefined);

        await this.Cache.set(key, "toObject" in data ? data.toObject() : data);
        if (objectId) await this.Cache.set(`_id.${objectId}`, key);
        clearTimeout(this.InMemoryTimer.get(key));

        this.InMemoryTimer.set(
            key,
            setTimeout(async () => this.removeFromCache(key, objectId), 1000 * 60 * 60),
        );
        return;
    }

    async getClientData(): Promise<ClientSchema> {

        const cache = await this.Cache.get(client.user!.id) as ClientSchema;
        if (cache) return cache;

        const data = await this.Client.findOne({ id: client.user?.id })
            .then(doc => doc?.toObject())
            .catch(() => null) as ClientSchema | null;

        if (data) {
            this.setCache(client.user!.id, data);
            return data;
        }

        const document = await new this.Client({ id: client.user?.id })?.save()?.then(doc => doc.toObject());
        if (document?.id) {
            this.setCache(client.user!.id, document);
            return document;
        }

        return { id: client.user!.id } as ClientSchema;
    }

    getBalance(userId: string, reply?: "balance" | "position"): Promise<{ balance: number, position: number }>
    getBalance(usersId: string[]): Promise<Collection<string, BalanceData>>
    async getBalance(userId: string | string[], reply?: "balance" | "position") {
        if (Array.isArray(userId)) return this.#getMultipleBalance(userId);
        if (!userId) return { balance: 0, position: 0 };

        if (reply === "balance")
            return (await this.getUser(userId))?.Balance || 0;

        const data = await this.Users.aggregate([
            {
                $set: { Balance: { $ifNull: ["$Balance", 0] } },
            },
            {
                $setWindowFields: {
                    partitionBy: null,
                    sortBy: { Balance: -1 },
                    output: { position: { $documentNumber: {} } },
                },
            },
            {
                $match: {
                    id: userId,
                },
            },
            {
                $project: { _id: null, id: true, Balance: true, position: true },
            },
        ]);

        if (reply === "position")
            return data[0]?.position || 0;

        return { balance: data[0]?.Balance || 0, position: data[0]?.position || 0 };
    }

    async #getMultipleBalance(usersId: string[]): Promise<Collection<string, BalanceData>> {

        const data = new Collection<string, BalanceData>();
        if (!usersId?.length) return data;

        const users = await this.Users.aggregate([
            {
                $set: { Balance: { $ifNull: ["$Balance", 0] } },
            },
            {
                $setWindowFields: {
                    partitionBy: null,
                    sortBy: { Balance: -1 },
                    output: { position: { $documentNumber: {} } },
                },
            },
            {
                $match: { id: { $in: usersId } },
            },
            {
                $project: { _id: null, id: true, Balance: true, position: true },
            },
        ]);

        for (const user of users) {
            if (typeof user?.id !== "string") continue;
            data.set(user.id, { balance: user?.Balance || 0, position: user?.position || 0 });
        }

        return data;
    }

    async editBalance(userId: string, data: TransactionsType) {

        if (
            !userId
            || !("getMilliseconds" in data.createdAt)
            || typeof data !== "object"
            || typeof data.value !== "number"
            || typeof data.type !== "string"
            || typeof data.keywordTranslate !== "string"
            || typeof data.method !== "string"
        ) return;

        socket.send({
            type: "transactions",
            transactionsData: { userId, value: data.value, method: data.method, data },
        });

        if (data.method === "set")
            return await this.Users.updateOne(
                { id: userId },
                {
                    $set: { Balance: data.value },
                    $push: {
                        Transactions: {
                            $each: [data],
                            $position: 0,
                        },
                    },
                },
                { upsert: true },
            );

        return await this.Users.updateOne(
            { id: userId },
            {
                $inc: {
                    Balance: data.method === "add" ? data.value : -data.value,
                },
                $push: {
                    Transactions: {
                        $each: [data],
                        $position: 0,
                    },
                },
            },
            { upsert: true },
        );

    }

    async refundAllRaces(guildsId: string[]) {
        if (!guildsId?.length) return;

        const raceDocs = await this.Race.find({ guildId: { $in: guildsId } });
        if (!raceDocs?.length) return;

        const documentsToDelete = new Set<string>();
        for await (const doc of raceDocs) {
            documentsToDelete.add(doc.id);
            if (!doc.userId || !doc.translateRefundKey || !doc.value) continue;
            await this.editBalance(
                doc.userId!,
                {
                    createdAt: new Date(),
                    keywordTranslate: doc.translateRefundKey as any,
                    method: "add",
                    mode: "system",
                    type: "system",
                    value: doc.value,
                },
            );
            continue;
        }

        await this.Race.deleteMany({ id: { $in: Array.from(documentsToDelete) } });
        return;
    }

}
