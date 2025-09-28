import { GlobalSystemNotificationManager } from "../../managers";

export default async (webhookUrl: string, data: any) => {

    if (
        !data
        && typeof data !== "object"
        && !data?.embeds?.length
        && !data?.content
    ) return;

    const webhook = await GlobalSystemNotificationManager.fetchWebhookThroughAPIByURL(webhookUrl);
    if (!webhook) return;

    return await GlobalSystemNotificationManager.sendMessage(
        {
            webhookUrl,
            ...data,
        },
        undefined,
        webhook,
    );

};