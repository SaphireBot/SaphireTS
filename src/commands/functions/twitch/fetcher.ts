import { env } from "process";
import socket from "../../../services/api/ws";
type ResponseType = { message: string } | [] | undefined;

export default async function fetcher<T = any>(url: string): Promise<ResponseType | T> {
    if (!url || typeof url !== "string") return;

    const response = await socket.twitch.ws
        .timeout(2500)
        .emitWithAck("fetch", url)
        .catch(() => null);

    if (response) return response;

    return await fetch(
        "https://twitch.discloud.app/fetch",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                authorization: env.TWITCH_CLIENT_SECRET,
                url
            }
        }
    )
        .then(res => res.json())
        .catch(() => null) as ResponseType;
}