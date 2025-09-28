import { Events } from "discord.js";
import client from "../saphire";
import { GlobalSystemNotificationManager } from "../managers";

client.on(Events.WebhooksUpdate, channel => {
  GlobalSystemNotificationManager.deleteWebhook(channel, true);
});