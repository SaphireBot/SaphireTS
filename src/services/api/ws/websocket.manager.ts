import { EventEmitter } from "events";
import { Socket, io } from "socket.io-client";
import { env } from "process";
import client from "../../../saphire";
import { WebsocketMessage } from "../../../@types/websocket";
import TwitchWebsocket from "./twitch.websocket";
import staffData from "./funtions/staffData";

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
                transports: ["websocket"],
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
            case "sendStaffData": staffData(this.ws); break;
            // case "refreshRanking": refreshRanking(); break;
            // case "console": console.log(data.message); break;
            // case "errorInPostingMessage": client.errorInPostingMessage(data.data, data.err); break;
            // case "globalAfk": globalAfkData(data.data); break;
            // case "notifyUser": client.users.send(data.userId, data.content).catch(() => { }); break;
            // case "blacklistRemove": client.blacklist.delete(data.id); break;
            // case "blacklistSet": client.blacklist.set(data.data.id, data.data); break;
            // default: console.log(`Shard ${client.shardId} | Unknown Message From Websocket | `, data); break;
        }
        return;
    }
}