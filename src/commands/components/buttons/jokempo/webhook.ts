import { WebhookClient } from "discord.js";
import { Config } from "../../../../util/constants";
import { GSNManager } from "../../../../managers";

export default async function webhookJokempo(channelId: string, webhookUrl?: string): Promise<WebhookClient | undefined> {

    if (webhookUrl) {
        const webhook = await GSNManager.fetchWebhookThroughAPIByURL(webhookUrl);
        if (webhook) return webhook;
    }

    const webhook = await GSNManager.findWebhookThroughAPI(channelId);

    return webhook || await GSNManager.createWebhookThroughAPI(
        channelId,
        {
            name: "Saphire Jokempo Global System",
            avatar: Config.WebhookJokempoIcon,
        },
    );

}