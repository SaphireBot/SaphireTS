import { Events } from "discord.js";
import client from "../saphire";
import { GSNManager } from "../managers";

client.on(Events.WebhooksUpdate, channel => {
  GSNManager.deleteWebhook(channel, true);
});