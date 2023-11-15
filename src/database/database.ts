import { connect, set } from "mongoose";
import Models from "./models";
import client from "../saphire";
import { ClientSchema } from "./models/client";
import { UserSchema } from "./models/user";
import { GuildSchema } from "./models/guild";
import { TransactionsType } from "../@types/commands";
import redis from "./redis";

export default class Database extends Models {
    prefixes = new Map<string, string[]>();
    Redis = redis;

    constructor() {
        super();
    }

    async connect() {
        set("strictQuery", true);
        return await connect(process.env.DATABASE_LINK_CONNECTION)
            .catch(err => {
                console.log("Mongoose Database | FAIL!\n--> " + err);
                return process.exit(12);
            });
    }

    async getPrefix(guildId: string | undefined) {
        if (!guildId) return ["s!", "-"];

        const prefix = this.prefixes.get(guildId);
        if (prefix) return prefix;

        const data = await this.getGuild(guildId);
        if (
            Array.isArray(data?.Prefixes)
            && (data?.Prefixes?.length || 0) > 0
        )
            this.prefixes.set(guildId, data?.Prefixes);
        else this.prefixes.set(guildId, ["s!", "-"]);

        return this.prefixes.get(guildId) || ["s!", "-"];
    }

    async getGuild(guildId: string): Promise<GuildSchema> {
        if (!guildId) return { id: guildId } as GuildSchema;

        const data = (await this.Redis.json.get(guildId) as any) as GuildSchema;
        if (data) return data;

        const guildData = await this.Guilds.findOne({ id: guildId });
        if (!guildData)
            return await new this.Guilds({ id: guildId })
                .save()
                .then(doc => {
                    const document = doc?.toObject();
                    if (document) {
                        this.setCache(guildId, document);
                        return document;
                    }
                    return { id: guildId } as GuildSchema;
                })
                .catch(err => {
                    console.log(err);
                    return { id: guildId } as GuildSchema;
                });

        this.setCache(guildId, guildData.toObject());
        return guildData.toObject();
    }

    async getUser(userId: string): Promise<UserSchema> {
        if (!userId) return { id: userId } as UserSchema;

        const cache = (await this.Redis.json.get(userId) as any) as UserSchema;
        if (cache) return cache;

        const data = await this.Users.findOne({ id: userId });
        if (!data)
            return await new this.Users({ id: userId })
                .save()
                .then(doc => {
                    const document = doc?.toObject();
                    if (document) {
                        this.setCache(userId, document);
                        return document;
                    }
                    return { id: userId } as UserSchema;
                })
                .catch(err => {
                    console.log(err);
                    return { id: userId } as UserSchema;
                });

        this.setCache(userId, data.toObject());
        return data.toObject();
    }

    async setCache(key: string, data: any, time?: number) {
        if (!key || !data || (time && typeof time !== "number")) return;
        await this.Redis.json.set(key, "$", data);
        await this.Redis.expire(key, time || 5 * 60);
        return;
    }

    async getUsers(usersId: string[]): Promise<UserSchema[] | []> {
        if (!usersId?.length) return [];

        let data = (await this.Redis.json.mGet(usersId, "$") as any) as UserSchema[];
        console.log(data);
        if (!Array.isArray(data)) data = [];

        data = data.filter(Boolean);

        if (data?.length !== usersId.length) {
            for await (const userId of usersId) {
                if (data.some(data => data.id === userId)) continue;
                data.push(await this.getUser(userId));
            }
        }

        return data.filter(Boolean) || [];
    }

    async getClientData(): Promise<ClientSchema> {
        if (client.data) return client.data;

        let data = (await this.Redis.json.get(client.user!.id) as any) as ClientSchema | null;
        if (data) {
            client.data = data;
            return data;
        }

        data = await this.Client.findOne({ id: client.user?.id })
            .then(doc => doc?.toObject())
            .catch(() => null) as ClientSchema | null;

        if (data) {
            client.data = data;
            this.setCache(client.user!.id, data);
            return data;
        }

        const document = new this.Client({ id: client.user?.id });
        if (document?.id) {
            client.data = await document.save();
            this.setCache(client.user!.id, client.data);
            return client.data;
        }

        return { id: client.user!.id } as ClientSchema;
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

        // if (socket.connected)
        //     socket?.send({
        //         type: "transactions",
        //         transactionsData: { userId, data }
        //     });

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

}
