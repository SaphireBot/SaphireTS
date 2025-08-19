import { EventEmitter } from "events";
import { Socket, io } from "socket.io-client";
import { env } from "process";
import { Clip, NotifierData, TwitchClassData, UserData } from "../../../@types/twitch";
import socket from ".";
import client from "../../../saphire";
import { urls } from "../../../util/constants";
import { discloud } from "discloud.app";

export default class TwitchWebsocket extends EventEmitter {
    declare ws: Socket;
    errors = 0;

    constructor() {
        super();
    }

    connect() {
        if (env.MACHINE === "localhost") return;
        this.ws = io(
            env.WEBSOCKET_TWITCH_API_LOGIN_URL,
            {
                reconnectionDelayMax: 5000,
                transports: ["websocket"],
                auth: {
                    token: env.WEBSOCKET_CONNECTION_AUTHORIZATION,
                },
            },
        )
            .on("connect", () => console.log(`[Twitch - Shard ${client.shardId}] Connected.`))
            .on("disconnect", () => console.log(`[Twitch - Shard ${client.shardId}] Disconnected.`))
            .on("connect_error", async error => {
                this.errors++;
                console.log(`[Twitch - Shard ${client.shardId}]`, error);
                if (error?.cause) console.log("ERROR CAUSE", error?.cause);

                if (this.errors > 3) {
                    this.ws.disconnect();
                    await discloud.apps.stop("twitch").catch(() => { });
                    this.errors = 0;
                }
            });
        // .on("message", console.log);

        return this;
    }

    async checkExistingStreamers(streamers: string[]): Promise<UserData[] | null | { message: string }> {
        const url = `https://api.twitch.tv/helix/users?${streamers.filter(Boolean).slice(0, 100).map(str => `login=${str}`).join("&")}`;
        let response: UserData[] | null = await socket.emitWithAck("twitch", 2000, "fetch", null, url);

        if (!response)
            response = await fetch(
                urls.saphireTwitch + "/fetch",
                { headers: { authorization: env.TWITCH_CLIENT_SECRET, url } },
            )
                .then(res => res.json())
                .catch(() => null) as UserData[] | null;

        return response;
    }

    async disable(streamer: string, channelId: string): Promise<boolean | null | { message: string }> {

        if (!streamer) return false;

        let response: boolean | null | { message: string } = await socket.emitWithAck("twitch", 1000, "disable", null, { streamer, channelId });

        if (!response)
            response = await fetch(
                urls.saphireTwitch + "/disable",
                {
                    method: "POST",
                    headers: {
                        authorization: env.TWITCH_CLIENT_SECRET,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ streamer, channelId }),
                },
            )
                .catch(() => false) as boolean | null | { message: string };

        return response;
    }

    async getGuildData(guildId: string): Promise<NotifierData[]> {
        if (!guildId) return [];

        // if (!socket.connected)
        return await this._getGuildData(guildId);

        // const response: NotifierData[] | null = await socket.emitWithAck("twitch", 1500, "guildData", null, guildId);
        // if (!Array.isArray(response)) return await this._getGuildData(guildId);
        // return response;
    }

    async _getGuildData(guildId: string): Promise<NotifierData[]> {
        const res = await fetch(
            urls.saphireTwitch + "/guildData",
            { headers: { authorization: env.TWITCH_CLIENT_SECRET, guildId } },
        )
            .then(res => res.json())
            .catch(() => []) as NotifierData[];
        return Array.isArray(res) ? res : [];
    }

    async getClips(streamerId: string): Promise<Clip[] | null> {

        let response: Clip[] | null = await socket.emitWithAck("twitch", 2000, "fetch", null, `https://api.twitch.tv/helix/clips?broadcaster_id=${streamerId}&first=25`);

        if (response === null)
            response = await fetch(
                urls.saphireTwitch + "/fetch",
                {
                    method: "GET",
                    headers: {
                        authorization: env.TWITCH_CLIENT_SECRET,
                        url: `https://api.twitch.tv/helix/clips?broadcaster_id=${streamerId}&first=25`,
                    },
                },
            )
                .then(res => res.json())
                .catch(() => null) as Clip[] | null;

        return response;
    }

    async getClip(clipId: string): Promise<Clip[] | null> {

        let response: Clip[] | null = await socket.emitWithAck("twitch", 2000, "fetch", null, `https://api.twitch.tv/helix/clips?id=${clipId}`);

        if (!response || !Array.isArray(response))
            response = await fetch(
                urls.saphireTwitch + "/fetch",
                {
                    method: "GET",
                    headers: {
                        authorization: env.TWITCH_CLIENT_SECRET,
                        url: `https://api.twitch.tv/helix/clips?id=${clipId}`,
                    },
                },
            )
                .then(res => res.json())
                .catch(() => null) as Clip[] | null;

        return response;
    }

    async getData(): Promise<TwitchClassData | null> {

        let response: TwitchClassData | null = await socket.emitWithAck("twitch", 2000, "data", null, "get");

        if (response === null)
            response = await fetch(urls.saphireTwitch + "/data")
                .then(res => res.json())
                .catch(() => null) as TwitchClassData | null;

        return response;
    }

    send(message: any) {
        if (!this.ws?.connected) return false;
        this.ws.send(message);
        return true;
    }

    emit(ev: string, ...args: any[]) {
        if (!this.ws?.connected) return false;
        this.ws.emit(ev, ...args);
        return true;
    }

}