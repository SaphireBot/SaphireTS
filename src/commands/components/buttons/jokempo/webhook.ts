import { WebhookClient } from "discord.js";
import { Config } from "../../../../util/constants";
import { GlobalSystemNotificationManager } from "../../../../managers";

export default async function webhookJokempo(channelId: string, webhookUrl?: string): Promise<WebhookClient | undefined> {

    if (webhookUrl) {
        const webhook = await GlobalSystemNotificationManager.fetchWebhookThroughAPIByURL(webhookUrl);
        if (webhook) return webhook;
    }

    const webhook = await GlobalSystemNotificationManager.findWebhookThroughAPI(channelId);

    return webhook || await GlobalSystemNotificationManager.createWebhookThroughAPI(
        channelId,
        {
            name: "Saphire Jokempo Global System",
            avatar: Config.WebhookJokempoIcon,
        },
    );

}