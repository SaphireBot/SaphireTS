import { env } from "process";
import socket from "../../../services/api/ws";
import { urls } from "../../../util/constants";
type ResponseType = { message: string } | [] | undefined;

export default async function fetcher<T = any>(url: string): Promise<ResponseType | T> {
    if (!url || typeof url !== "string") return;

    const response = await socket.emitWithAck("twitch", 2500, "fetch", null, url);
    if (response) return response;

    return await fetch(
        urls.saphireTwitch + "/fetch",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                authorization: env.TWITCH_CLIENT_SECRET,
                url,
            },
        },
    )
        .then(res => res.json())
        .catch(() => null) as ResponseType;
}