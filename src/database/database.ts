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

type BalanceData = { balance: number, position: number };

export default class Database extends Schemas {
    prefixes = new Map<string, string[]>();
    Redis = redis;
    Ranking = ranking;
    UserCache = userCache;

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

    watch() {
        this.Client.watch().on("change", async () => {
            const document = await this.Client.findOne({ id: client.user?.id });
            if (document) client.data = document?.toJSON();
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

        if (!guildId && !userId) return ["s!", "-"];

        if (guildId && !userId) {
            const prefixes = this.prefixes.get(guildId) || [];
            if (prefixes.length) return prefixes;
            const response = (await this.getGuild(guildId))?.Prefixes || [];
            if (!response.length) response.push(...["s!", "-"]);
            this.prefixes.set(guildId, response);
            return response;
        }

        if (!guildId && userId) {
            const prefixes = this.prefixes.get(userId) || [];
            if (prefixes.length) return prefixes;
            const response = (await this.getUser(userId))?.Prefixes || [];
            if (!response.length) response.push(...["s!", "-"]);
            this.prefixes.set(userId, response);
            return response;
        }

        const prefixesUser = this.prefixes.get(userId!) || [];
        const prefixesGuild = this.prefixes.get(guildId!) || [];

        if (!prefixesUser.length) {
            const prefixes = (await this.getUser(userId!))?.Prefixes || [];
            if (!prefixes.length) prefixes.push(...["s!", "-"]);
            this.prefixes.set(userId!, prefixes);
            prefixesUser.push(...prefixes);
        }

        if (!prefixesGuild.length) {
            const prefixes = (await this.getGuild(guildId!))?.Prefixes || [];
            if (!prefixes.length) prefixes.push(...["s!", "-"]);
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

        const cache = (await this.Redis.json.get(guildId) as any) as GuildSchema | null;
        if (cache) return (cache as any) as GuildSchema;

        const data = await this.Guilds.findOne({ id: guildId });
        if (!data)
            return await new this.Guilds({ id: guildId })
                .save()
                .then(doc => {
                    const document = doc?.toObject();
                    if (document) {
                        this.setCache(guildId, document, "cache");
                        return document;
                    }
                    return { id: guildId } as GuildSchema;
                })
                .catch(err => {
                    console.log(err);
                    return { id: guildId } as GuildSchema;
                });

        this.setCache(guildId, data.toObject(), "cache");
        return data.toObject();
    }

    async getGuilds(guildsIds: string[]): Promise<GuildSchema[]> {
        if (!guildsIds?.length) return [];

        const data = ((await this.Redis.json.mGet(guildsIds, "$") as any[]) as GuildSchema[])?.filter(Boolean).flat();

        if (data?.length !== guildsIds.length)
            for await (const id of guildsIds)
                if (!data?.some(d => d?.id === id))
                    data.push(await this.getGuild(id));

        return data;
    }

    async getUser(userId: string): Promise<UserSchema> {
        if (!userId) return { id: userId } as UserSchema;

        const cache = await this.Redis.json.get(userId) as UserSchema | null;
        if (cache) return (cache as any) as UserSchema;

        const data = await this.Users.findOne({ id: userId });
        if (!data && userId !== client.user!.id)
            return await new this.Users({ id: userId })
                .save()
                .then(doc => {
                    const document = doc?.toObject();
                    if (document) {
                        this.setCache(userId, document, "cache");
                        return document;
                    }
                    return { id: userId } as UserSchema;
                })
                .catch(err => {
                    console.log(err);
                    return { id: userId } as UserSchema;
                });

        if (data) {
            this.setCache(userId, data.toObject(), "cache");
            return data.toObject();
        }

        return { id: userId } as UserSchema;
    }

    async getBlockCommands() {
        const data = await this.Client.findOne({ id: client.user!.id });
        const blockedCommands = (data?.BlockedCommands || []) as { cmd: string, error: string }[];
        return blockedCommands;
    }

    async setCache(key: any, data: any, type: "cache" | "user", time?: number) {
        if (!key || !data || !type || (time && typeof time !== "number")) return;

        if (type === "cache") {
            const ok = await this.Redis.json.set(key, "$", "toObject" in data ? data.toObject() : data);
            if (ok) await this.Redis.expire(key, time || 60);
        }

        if (type === "user") {
            const ok = await this.UserCache.json.set(key, "$", data);
            if (ok) await this.UserCache.expire(key, time || 60);
        }

        return;
    }

    async getUsers(usersId: string[]): Promise<UserSchema[] | []> {
        if (!usersId?.length) return [];

        let data = (await this.Redis.json.mGet(usersId, "$") as any[]) as UserSchema[];
        if (!Array.isArray(data)) data = [];

        data = data.filter(Boolean);

        if (data?.length !== usersId.length)
            for await (const userId of usersId)
                if (!data.some(data => data?.id === userId))
                    data.push(await this.getUser(userId));

        return data.flat().filter(Boolean) || [];
    }

    async getClientData(): Promise<ClientSchema> {
        if (client.data) return client.data;

        const cache = await this.Redis.json.get(client.user!.id) as string | null;
        if (cache) {
            client.data = (cache as any) as ClientSchema;
            return client.data;
        }

        const data = await this.Client.findOne({ id: client.user?.id })
            .then(doc => doc?.toObject())
            .catch(() => null) as ClientSchema | null;

        if (data) {
            client.data = data;
            this.setCache(client.user!.id, data, "cache");
            return data;
        }

        const document = new this.Client({ id: client.user?.id });
        if (document?.id) {
            client.data = await document.save();
            this.setCache(client.user!.id, client.data, "cache");
            return client.data;
        }

        return { id: client.user!.id } as ClientSchema;
    }

    async getBalance(userId: string) {
        if (!userId) return { balance: 0, position: 0 };

        const balance = (await this.Users.findOne({ id: userId }))?.Balance || 0;
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
