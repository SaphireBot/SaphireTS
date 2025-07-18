import { EventEmitter } from "events";
import { Socket, io } from "socket.io-client";
import { env } from "process";
import client from "../../../saphire";
import { WebsocketMessage } from "../../../@types/websocket";
import TwitchWebsocket from "./twitch.websocket";
import getGiveaway from "./funtions/giveaway";
import handler from "../../../structures/commands/handler";
export type CallbackType = (data: any) => void;

export default class SocketManager extends EventEmitter {
    declare ws: Socket;
    declare twitch: TwitchWebsocket;
    listening = false;

    constructor() {
        super();
    }

    async connect() {
        if (env.MACHINE === "localhost") return;
        if (!this.ws?.connected)
            this.ws = io(
                env.WEBSOCKET_SAPHIRE_API_LOGIN_URL,
                {
                    reconnectionDelayMax: 5000,
                    transports: ["websocket"],
                    auth: {
                        token: env.WEBSOCKET_SAPHIRE_API_LOGIN_PASSWORD,
                        shardId: client.shardId,
                    },
                },
            )
                .on("connect", async () => {
                    // console.log("[WEBSOCKET]", `Shard ${client.shardId} connected.`);
                    return;
                })
                // .once("disconnect", () => console.log("[WEBSOCKET]", `Shard ${client.shardId} disconnected.`))
                // .on("connect_error", error => console.log(error?.message, error))
                .on("message", this.message);

        // if (this.twitch && !this.twitch?.ws?.connected)
        //     this.twitch = new TwitchWebsocket().connect();

        this.enableListeners();
        return;
    }

    get connected() {
        return this.ws?.connected;
    }

    async enableListeners() {
        if (this.listening) return;
        this.listening = true;
        this.ws.on("getGiveaway", async (giveawayId: string | undefined, callback: CallbackType) => await getGiveaway(giveawayId, callback));
        this.ws.on("commands", (_, callback: CallbackType) => callback(handler.APICrossData));
    }

    send(message: any) {
        if (!this.connected) return false;
        this.ws.send(message);
        return true;
    }

    timeout(timeout: number) {
        return this.ws.timeout(timeout);
    }

    async message(data: WebsocketMessage) {
        if (!data?.type) return;

        switch (data.type) {
            // case "refreshRanking": refreshRanking(); break;
            // case "console": console.log(data.message); break;
            // case "errorInPostingMessage": client.errorInPostingMessage(data.data, data.err); break;
            // case "notifyUser": client.users.send(data.userId, data.content).catch(() => { }); break;
            // case "blacklistRemove": client.blacklist.delete(data.id); break;
            // case "blacklistSet": client.blacklist.set(data.data.id, data.data); break;
            // default: console.log(`Shard ${client.shardId} | Unknown Message From Websocket | `, data); break;
        }
        return;
    }

    async emitWithAck(socket: "api" | "twitch", timeout: number, event: string, defaultCallback: any, ...args: any[]) {

        if (
            !["twitch", "api"].includes(socket)
            || !timeout || (typeof timeout !== "number")
            || !event || (typeof event !== "string")
            || !args
        )
            return defaultCallback || null;

        const ws = socket === "api" ? this.ws : this.twitch?.ws;

        if (!ws?.connected) return defaultCallback;
        return await ws.timeout(timeout).emitWithAck(event, ...args).catch(() => defaultCallback);
    }
}