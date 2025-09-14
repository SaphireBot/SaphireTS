import { GSNManager } from "../../managers";

export default async (webhookUrl: string, data: any) => {

    if (
        !data
        && typeof data !== "object"
        && !data?.embeds?.length
        && !data?.content
    ) return;

    const webhook = await GSNManager.fetchWebhookThroughAPIByURL(webhookUrl);
    if (!webhook) return;

    return await GSNManager.sendMessage(
        {
            webhookUrl,
            ...data,
        },
        undefined,
        webhook,
    );

};