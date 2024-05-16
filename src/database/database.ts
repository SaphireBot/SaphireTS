import Schemas from "./schemas";
import client from "../saphire";
import { ClientSchemaType as ClientSchema } from "./schemas/client";
import { GuildSchemaType as GuildSchema } from "./schemas/guild";
import { TransactionsType } from "../@types/commands";
import { redis, ranking, userCache } from "./redis";
import socket from "../services/api/ws";
import { UserSchemaType as UserSchema } from "./schemas/user";
import {
    SaphireMongooseCluster,
    BetMongooseCluster,
    RecordMongooseCluster
} from "./connection";
import { Collection } from "discord.js";
import { MercadoPagoPaymentSchema } from "./schemas/mercadopago";
import { QuickDB } from "quick.db";
import { WatchChange } from "../@types/database";
import { Types } from "mongoose";
import handler from "../structures/commands/handler";

type BalanceData = { balance: number, position: number };

export default class Database extends Schemas {
    prefixes = new Map<string, string[]>();
    Cache = new QuickDB({ filePath: "cache.sqlite" });
    QuizCache = new QuickDB({ filePath: "quiz.sqlite" });
    Redis = redis;
    Ranking = ranking;
    UserCache = userCache;
    InMemoryTimer = new Map<string, NodeJS.Timeout>();

    Clusters = {
        Saphire: SaphireMongooseCluster,
        Bet: BetMongooseCluster,
        Reocrd: RecordMongooseCluster
    };

    // Saphire Models
    Guilds = SaphireMongooseCluster.model("Guilds", this.GuildSchema);
    Users = SaphireMongooseCluster.model("Users", this.UserSchema);
    Client = SaphireMongooseCluster.model("Client", this.ClientSchema);
    Blacklist = SaphireMongooseCluster.model("Blacklist", this.BlacklistSchema);
    Twitch = SaphireMongooseCluster.model("Twitch", this.TwitchSchema);
    Reminders = SaphireMongooseCluster.model("Reminders", this.ReminderSchema);
    Commands = SaphireMongooseCluster.model("Commands", this.CommandSchema);
    Afk = SaphireMongooseCluster.model("Afk", this.AfkSchema);
    Vote = SaphireMongooseCluster.model("Vote", this.VoteSchema);

    // Bet Game Models
    Jokempo = BetMongooseCluster.model("Jokempo", this.JokempoSchema);
    Pay = BetMongooseCluster.model("Pay", this.PaySchema);
    Crash = BetMongooseCluster.model("Crash", this.CrashSchema);
    Race = BetMongooseCluster.model("Race", this.RaceSchema);
    Connect4 = BetMongooseCluster.model("Connect4", this.Connect4Schema);
    Battleroyale = BetMongooseCluster.model("Battleroyale", this.BattleroyaleSchema);
    CharactersCache = BetMongooseCluster.model("CharacterCache", this.CharacterSchema);
    Characters = BetMongooseCluster.model("Character", this.CharacterSchema);

    // Records
    Payments = RecordMongooseCluster.model("MercadoPago", MercadoPagoPaymentSchema);

    constructor() {
        super();
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
                        if (client.shardId !== 0) return;
                        return await this.setCache(client.user!.id, document.toObject(), "cache");
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
                    if (document) await this.setCache(document.id, document.toObject(), "cache");
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
                    if (document) await this.setCache(document.id, document.toObject(), "cache");
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
        SaphireCluster: async () => await SaphireMongooseCluster.db.admin()?.ping(),
        BetCluster: async () => await BetMongooseCluster.db?.admin()?.ping(),
        RecordCluster: async () => await RecordMongooseCluster.db?.admin()?.ping()
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
            this.setCache(guildId, data.toObject(), "cache");
            return data;
        }

        return await new this.Guilds({ id: guildId })
            .save()
            .then(doc => {
                const document = doc?.toObject();
                if (document) this.setCache(guildId, document, "cache");
                return document || { id: guildId } as GuildSchema;
            })
            .catch(err => {
                console.log(err);
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
                    setTimeout(async () => this.removeFromCache(userId, cache._id), 1000 * 60 * 60)
                );
            return cache;
        }

        const data = await this.Users.findOne({ id: userId });
        if (data) {
            this.setCache(userId, data.toObject(), "cache");
            return data;
        }

        if (userId !== client.user!.id)
            return await new this.Users({ id: userId })
                .save()
                .then(doc => {
                    const document = doc?.toObject();
                    if (document) this.setCache(userId, document, "cache");
                    return document || { id: userId } as UserSchema;
                })
                .catch(err => {
                    console.log(err);
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

    async setCache(key: any, data: any, type: "cache" | "user", time?: number) {
        if (
            !key || !data || !type
            || (time && typeof time !== "number")
            || client.shard?.id !== 0
        ) return;

        if (type === "cache") {

            if (key.includes("AFK")) {
                const ok = await this.Redis.json.set(key, "$", "toObject" in data ? data.toObject() : data);
                if (ok) await this.Redis.expire(key, time || 60);
                return;
            }

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

        if (type === "user") {
            const ok = await this.UserCache.json.set(key, "$", data);
            if (ok) await this.UserCache.expire(key, time || 60);
        }

        return;
    }

    async getClientData(): Promise<ClientSchema> {

        const cache = await this.Cache.get(client.user!.id) as ClientSchema;
        if (cache) return cache;

        const data = await this.Client.findOne({ id: client.user?.id })
            .then(doc => doc?.toObject())
            .catch(() => null) as ClientSchema | null;

        if (data) {
            this.setCache(client.user!.id, data, "cache");
            return data;
        }

        const document = await new this.Client({ id: client.user?.id })?.save()?.then(doc => doc.toObject());
        if (document?.id) {
            this.setCache(client.user!.id, document, "cache");
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
            || isNaN(data.value)
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
}
