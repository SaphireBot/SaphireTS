import { connect, set } from "mongoose";
import Models from "./models";
import socket from "../services/api/ws";
import client from "../saphire";
import { ClientSchema } from "./models/client";
import { UserSchema } from "./models/user";
import { GuildSchema } from "./models/guild";
import { TransactionsType } from "../@types/commands";

export default class Database extends Models {
    prefixes = new Map<string, string[]>();

    constructor() {
        super();
    }

    async connect() {
        set("strictQuery", true);
        return await connect(process.env.DATABASE_LINK_CONNECTION)
            .then(data => {
                this.watch();
                return data;
            })
            .catch(err => {
                console.log("Mongoose Database | FAIL!\n--> " + err);
                return process.exit(12);
            });
    }

    async getPrefix(guildId: string | undefined) {
        if (!guildId) return ["s!", "-"];

        const prefix = this.prefixes.get(guildId);
        if (prefix) return prefix;

        const guildData = await this.getGuild(guildId);
        if (
            guildData?.Prefixes
            && Array.isArray(guildData?.Prefixes)
            && (guildData?.Prefixes?.length || 0) > 0
        )
            this.prefixes.set(guildId, guildData?.Prefixes);
        else this.prefixes.set(guildId, ["s!", "-"]);

        return this.prefixes.get(guildId) || ["s!", "-"];
    }

    async getGuild(guildId: string): Promise<GuildSchema | undefined | void> {
        if (socket.connected) {
            const data = await socket.getGuild(guildId);
            if (data) return data;
        }

        const guildData = await this.Guilds.findOne({ id: guildId });
        if (!guildData)
            return new this.Guilds({ id: guildId })
                .save()
                .then(doc => doc.toObject())
                .catch(err => {
                    console.log(err);
                    return;
                });

        return guildData.toObject();
    }

    async getUser(userId: string): Promise<UserSchema | undefined | void> {
        // if (socket.connected) {
        //     const data = await socket.getUser(userId);
        //     if (data) return data;
        // }

        const userData = await this.Users.findOne({ id: userId });
        if (!userData)
            return new this.Users({ id: userId })
                .save()
                .then(doc => doc.toObject())
                .catch(err => {
                    console.log(err);
                    return;
                });

        return userData.toObject();
    }

    async getUsers(usersId: string[]): Promise<UserSchema[] | []> {
        let data: UserSchema[] = []; // await socket.getUsers(usersId);
        // if (data) return data || [];

        if (data?.length !== usersId.length) {
            data = await this.Users.find({ id: { $in: usersId } });
            if (!data?.length) {
                for (const id of usersId)
                    new this.Users({ id: id })
                        .save()
                        .then(doc => data.push(doc.toObject()))
                        .catch(err => {
                            console.log(err);
                            return;
                        });

                return data || [];
            }
        }

        return data || [];
    }

    async getClientData() {
        const data = client.data;

        if (!data) {
            client.data = await this.Client.findOne({ id: client.user?.id })
                .then(doc => doc?.toObject())
                .catch(() => null) as ClientSchema | null;

            if (!client.data) {
                const newData = new this.Client({ id: client.user?.id });
                const saveData = await newData.save();
                client.data = saveData;
            }

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
                }
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
            }
        );

    }

    async watch() {
        let refreshing = false;
        this.Client.watch()
            .on("change", async () => {

                if (refreshing) return;
                refreshing = true;

                setTimeout(async () => {
                    client.data = await this.Client.findOne({ id: client.user!.id });
                    refreshing = false;
                }, 1500);

            });
    }
}
