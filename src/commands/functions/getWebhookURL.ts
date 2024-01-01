import { Routes } from "discord.js";
import client from "../../saphire";
import { Config } from "../../util/constants";

export default async function getWebhookURL(channelId: string) {

    const webhooks = await client.rest.get(Routes.channelWebhooks(channelId)).catch(() => null);

    if (webhooks && Array.isArray(webhooks) && webhooks.length) {
        const webhook = webhooks.find(w => w?.user?.id === client.user?.id);
        if (webhook) return `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;
    }

    const newWebhook = await client.rest.post(Routes.channelWebhooks(channelId), {
        body: {
            name: "Saphire Jokempo Global System",
            avatar: `${Config.WebhookJokempoIcon}`,
        }
    }).catch(() => null);

    if (!newWebhook) return null;
    return `https://discord.com/api/webhooks/${(newWebhook as any).id}/${(newWebhook as any).token}`;
}