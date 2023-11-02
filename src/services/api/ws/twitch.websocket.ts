import { EventEmitter } from "events";
import { Socket, io } from "socket.io-client";
import { env } from "process";
import client from "../../../saphire";
import { UserData } from "../../../@types/twitch";

export default class TwitchWebsocket extends EventEmitter {
    declare ws: Socket;

    constructor() {
        super({ captureRejections: true });
    }

    connect() {
        this.ws = io(
            env.WEBSOCKET_TWITCH_API_LOGIN_URL,
            {
                reconnectionDelayMax: 5000,
                auth: {
                    token: env.WEBSOCKET_CONNECTION_AUTHORIZATION
                }
            }
        )
            // .once("connect", () => console.log("[WEBSOCKET]", `Shard ${client.shardId} connected.`))
            .once("disconnect", () => console.log("[WEBSOCKET]", `Shard ${client.shardId} disconnected.`))
            .on("connect_error", console.error)
            .on("message", console.log);

        return this;
    }

    async checkExistingStreamers(streamers: string[]): Promise<UserData[] | null | "TIMEOUT"> {
        const url = `https://api.twitch.tv/helix/users?${streamers.filter(Boolean).slice(0, 100).map(str => `login=${str}`).join("&")}`;
        let response = await this.ws
            .timeout(1000)
            .emitWithAck("fetch", url)
            .catch(() => null) as UserData[] | null;

        if (!response)
            response = await fetch(
                "https://twitch.discloud.app/fetch",
                { headers: { authorization: env.TWITCH_CLIENT_SECRET, url } }
            )
                .catch(() => null) as UserData[] | null;
        
        return response;
    }
}