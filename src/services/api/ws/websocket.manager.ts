import { EventEmitter } from "events";
import { Socket, io } from "socket.io-client";
import { env } from "process";
import client from "../../../saphire";
import { WebsocketMessage } from "../../../@types/websocket";
import { ClientSchema } from "../../../database/models/client";
// import { GuildSchema } from "../../../database/models/guild";
import { UserSchema } from "../../../database/models/user";
import Database from "../../../database";
import TwitchWebsocket from "./twitch.websocket";

export default class SocketManager extends EventEmitter {
    declare ws: Socket;
    declare twitch: TwitchWebsocket;

    constructor() {
        super({ captureRejections: true });
    }

    async connect() {
        this.ws = io(
            env.WEBSOCKET_SAPHIRE_API_LOGIN_URL,
            {
                reconnectionDelayMax: 5000,
                auth: {
                    token: env.WEBSOCKET_SAPHIRE_API_LOGIN_PASSWORD,
                    shardId: 10
                }
            }
        )
            // .once("connect", () => console.log("[WEBSOCKET]", `Shard ${client.shardId} connected.`))
            .once("disconnect", () => console.log("[WEBSOCKET]", `Shard ${client.shardId} disconnected.`))
            .on("connect_error", console.error)
            .on("message", this.message);
        
        this.twitch = new TwitchWebsocket().connect();
    }

    get connected() {
        return this.ws?.connected;
    }

    send(message: any) {
        this.ws.send(message);
    }

    timeout(timeout: number) {
        return this.ws.timeout(timeout);
    }

    message(data: WebsocketMessage) {
        if (!data?.type) return;

        switch (data.type) {
            // case "sendStaffData": client.setStaffToApi(); break;
            // case "refreshRanking": refreshRanking(); break;
            case "console": console.log(data.message); break;
            // case "topgg": reward(data.message); break;
            // case "errorInPostingMessage": client.errorInPostingMessage(data.data, data.err); break;
            // case "globalAfk": globalAfkData(data.data); break;
            // case "notifyUser": client.users.send(data.userId, data.content).catch(() => { }); break;
            // case "blacklistRemove": client.blacklist.delete(data.id); break;
            // case "blacklistSet": client.blacklist.set(data.data.id, data.data); break;
            // default: console.log(`Shard ${client.shardId} | Unknown Message From Websocket | `, data); break;
        }
        return;
    }

    async getGuild(guildId: string) {
        if (!guildId) return;

        const data = null; // await this
        // .timeout(1000)
        // .emitWithAck("getCache", { id: guildId, type: "guild" })
        // .catch(() => undefined) as GuildSchema | undefined;

        return data || (await Database.Guilds.findOne({ id: guildId }))?.toObject();
    }

    async getUser(userId: string) {
        if (!userId) return;

        const data = null; // await this
        //     .timeout(1000)
        //     .emitWithAck("getCache", { id: userId, type: "user" })
        //     .catch(() => undefined) as UserSchema | undefined;

        if (data) return data;
        return (await Database.Users.findOne({ id: userId }))?.toObject();
    }

    async getUsers(usersId: string[]) {
        if (!usersId?.length) return [];

        const data: UserSchema[] = await this?.timeout(1500).emitWithAck("getMultipleCache", { ids: usersId, type: "user" }).catch(() => []);

        if (data?.length !== usersId.length) {
            const data = await Database.Users.find({ id: { $in: usersId } });
            if (!data?.length) return [];
            this?.send({ type: "updateCache", to: "user", data: [data] });
        }

        return data;
    }

    async getBalance(userId: string): Promise<{ balance: number, position: number }> {
        if (this.connected) {
            const data = await this
                .timeout(1000)
                .emitWithAck("getCache", {
                    id: userId,
                    type: "ranking"
                })
                .catch(() => null);

            if (!data) return byDatabase(await this.getUser(userId));

            return data;

        } else return byDatabase(await this.getUser(userId));

        async function byDatabase(data: UserSchema | undefined) {
            return { balance: data?.Balance || 0, position: 0 };
        }
    }

    async getMultipleBalance(usersId: string[]): Promise<{ id: string, balance: number, position: number }[]> {
        if (this.connected) {
            const data = await this
                .timeout(1000)
                .emitWithAck("getMultipleCache", {
                    ids: usersId,
                    type: "ranking"
                })
                .then(v => v.filter(Boolean))
                .catch(() => null);

            if (data?.length !== usersId.length) return byDatabase(usersId);

            return data?.filter(Boolean);

        } else return byDatabase(usersId);

        async function byDatabase(usersId: string[]) {

            const data = await Database.Users.find({ Balance: { $exists: true } }, "id Balance")
                .sort({ "Balance": -1 });

            const values = [];

            for await (const id of usersId) {
                const userData = data.find(d => d.id === id);
                if (userData) {
                    values.push({
                        id,
                        balance: userData.Balance || 0,
                        position: data.findIndex(d => d.id === id) + 1
                    });
                } else values.push({ id, balance: 0, position: 0 });
                continue;
            }

            return values;
        }
    }

    async getClientData(): Promise<ClientSchema | void> {
        return await this
            .timeout(1000)
            .emitWithAck("getCache", { id: client.user?.id, type: "client" })
            .catch(() => { }) as ClientSchema | void;
    }
}