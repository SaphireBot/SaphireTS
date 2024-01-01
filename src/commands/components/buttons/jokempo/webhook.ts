import { Routes, APIWebhook, WebhookClient } from "discord.js";
import client from "../../../../saphire";
import { Config } from "../../../../util/constants";

export default async function webhookJokempo(channelId: string, webhookUrl?: string): Promise<WebhookClient | undefined> {

    if (webhookUrl) {
        const webhook = await fetch(webhookUrl)
            .then(res => res.json())
            .catch(() => null) as APIWebhook;
        if (webhook?.url)
            return new WebhookClient({ url: webhook?.url });
    }

    const webhooks = await client.rest.get(Routes.channelWebhooks(channelId)).catch(() => []) as APIWebhook[];

    if (webhooks?.length && Array.isArray(webhooks)) {
        const webhook = webhooks.find(w => w?.user?.id === client.user!.id);
        if (webhook)
            return new WebhookClient({
                url: webhook.url || `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`
            });
    }

    const webhook = await client.rest.post(
        Routes.channelWebhooks(channelId),
        {
            body: {
                name: "Saphire Jokempo Global System",
                avatar: Config.WebhookJokempoIcon
            }
        }
    )
        .catch(() => null) as APIWebhook | null;

    if (webhook?.id && webhook?.token)
        return new WebhookClient({
            url: webhook?.url || `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`
        });

    return;
}