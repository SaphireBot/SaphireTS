import Schemas from "./schemas";
import client from "../saphire";
import { ClientSchemaType as ClientSchema } from "./schemas/client";
import { GuildSchemaType as GuildSchema, GuildSchemaType } from "./schemas/guild";
import { TransactionsType } from "../@types/commands";
import { redis, ranking, userCache } from "./redis";
import socket from "../services/api/ws";
import { UserSchemaType as UserSchema } from "./schemas/user";
import { Collection } from "discord.js";
import { MercadoPagoPaymentSchema } from "./schemas/mercadopago";
import { QuickDB } from "quick.db";
import { Guild, WatchChange } from "../@types/database";
import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
import handler from "../structures/commands/handler";
import { urls } from "../util/constants";
import { env } from "process";
import Mongoose from "mongoose";
import feedbackAfterRestart from "../events/functions/restart.feedback";
import getGuildsAndLoadSystems from "../events/functions/getGuildsAndLoadSystems";

type BalanceData = { balance: number, position: number };

export default class Database extends Schemas {
    prefixes = new Map<string, string[]>();
    Cache = new QuickDB({ filePath: "sqlite/cache.sqlite" });
    QuizCache = new QuickDB({ filePath: "sqlite/quiz.sqlite" });
    Games = new QuickDB({ filePath: "sqlite/games.sqlite" });
    Redis = redis;
    Ranking = ranking;
    UserCache = userCache;
    InMemoryTimer = new Map<string, NodeJS.Timeout>();

    headersAuthorization = {
        authorization: env.APIV2_AUTHORIZATION_KEY,
        "Content-Type": "application/json"
    };

    // Saphire Models
    Guilds = Mongoose.model("Guilds", this.GuildSchema);
    Users = Mongoose.model("Users", this.UserSchema);
    Client = Mongoose.model("Client", this.ClientSchema);
    Blacklist = Mongoose.model("Blacklist", this.BlacklistSchema);
    Twitch = Mongoose.model("Twitch", this.TwitchSchema);
    Reminders = Mongoose.model("Reminders", this.ReminderSchema);
    Commands = Mongoose.model("Commands", this.CommandSchema);
    Afk = Mongoose.model("Afk", this.AfkSchema);

    // Bet Game Models
    Jokempo = Mongoose.model("Jokempo", this.JokempoSchema);
    Pay = Mongoose.model("Pay", this.PaySchema);
    Crash = Mongoose.model("Crash", this.CrashSchema);
    Race = Mongoose.model("Race", this.RaceSchema);
    Connect4 = Mongoose.model("Connect4", this.Connect4Schema);
    Battleroyale = Mongoose.model("Battleroyale", this.BattleroyaleSchema);
    CharactersCache = Mongoose.model("CharacterCache", this.CharacterSchema);
    Characters = Mongoose.model("Character", this.CharacterSchema);

    // Records
    Payments = Mongoose.model("MercadoPago", MercadoPagoPaymentSchema);

    constructor() {
        super();
    }

    async connect() {

        try {

            const connection = await Mongoose.connect(
                env.MACHINE === "discloud"
                    ? env.SAPHIRE_DATABASE_LINK_CONNECTION
                    : env.CANARY_DATABASE_LINK_CONNECTION
            )
                .then(mongoose => mongoose.connection);

            connection.on("connected", () => console.log(`[Mongoose - Shard ${client.shardId}] Connected`));
            connection.on("error", error => console.log(`[Mongoose Error - Shard ${client.shardId}]`, error));

            const interval = setInterval(async () => {
                if (client.isReady() && typeof client.shardId === "number") {
                    clearInterval(interval);
                    this.watch();
                    return await getGuildsAndLoadSystems();
                }
            }, 2000);
            await feedbackAfterRestart();
            return this;
        } catch (err) {
            console.log("[Mongoose] Cluster Saphire Connection Failed", err);
            return process.exit(1);
        }

    }

    async flushAll() {
        await this.Redis.flushAll();
        await this.Ranking.flushAll();
        await this.UserCache.flushAll();
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
                                started: document.rebooting?.started || false
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
            .on("change", async (change: WatchChange) => {
                if (["insert", "update"].includes(change.operationType)) {
                    const document = await this.Guilds.findById(change.documentKey._id);
                    if (document) await this.setCache(document.id, document.toObject());
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
        SaphireCluster: async () => Mongoose.connection?.db?.admin()?.ping()
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
                    prefixesGuild
                ].flat()
            )
        ).filter(Boolean);

    }

    async getGuild(guildId: string): Promise<GuildSchema> {
        if (!guildId) return { id: guildId } as GuildSchema;

        // const fromApi = await fetch(
        //     `${urls.saphireApiV2}/guilds/${guildId}`,
        //     { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        // )
        //     .then(res => res.json())
        //     .catch(err => console.log(err)) as GuildSchema | void;
        // if (fromApi) return fromApi;

        const cache = await this.Cache.get(guildId) as GuildSchema;
        if (cache) {
            if (!this.InMemoryTimer.has(guildId))
                this.InMemoryTimer.set(
                    guildId,
                    setTimeout(async () => this.removeFromCache(guildId, cache._id), 1000 * 60 * 60)
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

        // const fromApi = await fetch(
        //     `${urls.saphireApiV2}/users/${userId}`,
        //     { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
        // )
        //     .then(res => res.json()) as UserSchema;
        // if (fromApi?.id) return fromApi;

        const cache = await this.Cache.get(userId) as UserSchema;
        if (cache) {
            if (!this.InMemoryTimer.has(userId))
                this.InMemoryTimer.set(
                    userId,
                    setTimeout(async () => this.removeFromCache(userId, cache._id), 1000 * 60 * 60)
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
            setTimeout(async () => this.removeFromCache(key, objectId), 1000 * 60 * 60)
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

    async getBalance(userId: string) {
        if (!userId) return { balance: 0, position: 0 };

        const balance = (await this.getUser(userId))?.Balance || 0;
        let position = await this.Ranking.zRevRank("balance", userId);
        position = typeof position !== "number" ? 0 : position + 1;

        return { balance, position };
    }

    async getMultipleBalance(usersId: string[]): Promise<Collection<string, BalanceData>> {

        const data = new Collection<string, BalanceData>();

        if (!usersId?.length) return data;

        const users = await this.getUsers(usersId);

        for await (const user of users) {
            if (typeof user?.id !== "string") continue;
            let position = (await this.Ranking.zRevRank("balance", user.id) as any);
            if (typeof position !== "number") position = 0;
            else position++;
            data.set(user.id, { balance: user?.Balance || 0, position });
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
            transactionsData: { userId, value: data.value, method: data.method, data }
        });

        if (data.method === "set")
            return await this.Users.updateOne(
                { id: userId },
                {
                    $set: { Balance: data.value },
                    $push: {
                        Transactions: {
                            $each: [data],
                            $position: 0
                        }
                    }
                },
                { upsert: true }
            );

        return await this.Users.updateOne(
            { id: userId },
            {
                $inc: {
                    Balance: data.method === "add" ? data.value : -data.value
                },
                $push: {
                    Transactions: {
                        $each: [data],
                        $position: 0
                    }
                }
            },
            { upsert: true }
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
                    value: doc.value
                }
            );
            continue;
        }

        await this.Race.deleteMany({ id: { $in: Array.from(documentsToDelete) } });
        return;
    }

    async fetchGuild(query: FilterQuery<GuildSchemaType> | string | string[]): Promise<GuildSchemaType | GuildSchemaType[] | void> {

        if (!query) return;

        if (typeof query === "string")
            return await fetch(
                `${urls.saphireApiV2}/guilds/${query}`,
                { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
            )
                .then(res => res.json())
                .catch(() => undefined) as GuildSchemaType | undefined;

        if (Array.isArray(query) && query.length)
            return await fetch(
                `${urls.saphireApiV2}/guilds?${query.map(id => `id=${id}`).join("&")}`,
                { headers: { authorization: env.APIV2_AUTHORIZATION_KEY } }
            )
                .then(res => res.json()) as GuildSchemaType[];

        if (query)
            return await fetch(
                `${urls.saphireApiV2}/guilds`,
                {
                    method: "GET",
                    headers: this.headersAuthorization,
                    body: JSON.stringify(query)
                }
            )
                .then(res => res.json()) as GuildSchemaType[];

        return;
    }

    GuildsUpdate = {
        update: async (query: { filter: FilterQuery<GuildSchemaType>, query: UpdateQuery<GuildSchemaType>, options: QueryOptions<GuildSchemaType> }) => {
            return await fetch(
                `${urls.saphireApiV2}/guilds`,
                {
                    method: "POST",
                    headers: this.headersAuthorization,
                    body: JSON.stringify(query)
                }
            )
                .then(res => res.json()) as GuildSchemaType;
        },
        create: async (data: GuildSchemaType) => {
            return await fetch(
                `${urls.saphireApiV2}/guilds`,
                {
                    method: "PUT",
                    headers: this.headersAuthorization,
                    body: JSON.stringify(data)
                }
            )
                .then(res => res.json()) as Guild;
        },
        delete: async (query: { filter: FilterQuery<GuildSchemaType> } | string) => {

            if (typeof query === "string")
                return await fetch(`${urls.saphireApiV2}/guilds/${query}`,
                    {
                        method: "DELETE",
                        headers: { authorization: env.APIV2_AUTHORIZATION_KEY }
                    }
                ).then(res => res.json()); // TODO: Falta o type

            if (query?.filter)
                return await fetch(
                    `${urls.saphireApiV2}/guilds`,
                    {
                        method: "DELETE",
                        headers: this.headersAuthorization,
                        body: JSON.stringify(query)
                    }
                )
                    .then(res => res.json()); // TODO: Falta o type
        }
    };

}
