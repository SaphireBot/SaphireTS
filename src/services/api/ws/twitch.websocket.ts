import { EventEmitter } from "events";
import { Socket, io } from "socket.io-client";
import { env } from "process";
import client from "../../../saphire";
import { Clip, NotifierData, UserData } from "../../../@types/twitch";

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
                transports: ["websocket"],
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

    async checkExistingStreamers(streamers: string[]): Promise<UserData[] | null | { message: string }> {
        const url = `https://api.twitch.tv/helix/users?${streamers.filter(Boolean).slice(0, 100).map(str => `login=${str}`).join("&")}`;
        let response = await this.ws
            .timeout(2000)
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

    async disable(streamer: string, channelId: string): Promise<boolean | null | { message: string }> {

        if (!streamer) return false;

        let response = await this.ws
            .timeout(1000)
            .emitWithAck("disable", { streamer, channelId })
            .catch(() => null) as boolean | null | { message: string };

        if (response === null)
            response = await fetch(
                "https://twitch.discloud.app/disable",
                {
                    method: "POST",
                    headers: {
                        authorization: env.TWITCH_CLIENT_SECRET,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ streamer, channelId })
                }
            )
                .catch(() => false) as boolean | null | { message: string };

        return response;
    }

    async getGuildData(guildId: string): Promise<NotifierData[]> {
        if (!guildId) return [];

        let response = await this.ws
            .timeout(1500)
            .emitWithAck("guildData", guildId)
            .catch(() => null) as NotifierData[] | null;

        if (response === null)
            response = await fetch(
                "https://twitch.discloud.app/guildData",
                { headers: { authorization: env.TWITCH_CLIENT_SECRET, guildId } }
            )
                .catch(() => []) as NotifierData[];

        return response;
    }

    async getClips(streamerId: string): Promise<Clip[] | null> {
        let response = await this.ws
            .timeout(2000)
            .emitWithAck("getClips", `https://api.twitch.tv/helix/clips?broadcaster_id=${streamerId}&first=25`)
            .catch(() => null) as Clip[]| null;

        if (response === null)
            response = await fetch(
                "https://twitch.discloud.app/fetch",
                {
                    method: "GET",
                    headers: {
                        authorization: env.TWITCH_CLIENT_SECRET,
                        url: `https://api.twitch.tv/helix/clips?broadcaster_id=${streamerId}&first=25`
                    }
                }
            )
                .then(res => res.json())
                .catch(() => null) as Clip[] | null;

        return response;
    }

    async getClip(clipId: string): Promise<Clip[] | null> {
        let response = await this.ws
            .timeout(2000)
            .emitWithAck("fetch", `https://api.twitch.tv/helix/clips?id=${clipId}`)
            .catch(() => null) as Clip[] | null;

        if (response === null)
            response = await fetch(
                "https://twitch.discloud.app/fetch",
                {
                    method: "GET",
                    headers: {
                        authorization: env.TWITCH_CLIENT_SECRET,
                        url: `https://api.twitch.tv/helix/clips?id=${clipId}`
                    }
                }
            )
                .then(res => res.json())
                .catch(() => null) as Clip[] | null;

        return response;
    }

}