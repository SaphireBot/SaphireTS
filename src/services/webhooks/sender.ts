import { env } from "process";

export default async (webhookUrl: string, data: any) => {

    if (
        !data
        && typeof data !== "object"
        && !data?.embeds?.length
        && !data?.content
    ) return;

    return fetch(
        webhookUrl,
        {
            method: "POST",
            body: JSON.stringify({
                webhookUrl,
                ...data
            }),
            headers: {
                "Content-Type": "application/json",
                authorization: env.WEBHOOK_SENDER_AUTHORIZATION
            }
        }
    )
        .then(() => true)
        .catch(err => err);

};