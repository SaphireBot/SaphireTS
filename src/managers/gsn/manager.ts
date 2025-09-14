import {
  type WebhookType,
  type Channel,
  type GuildTextBasedChannel,
  type GuildBasedChannel,
  type MessageResolvable,
  Webhook,
  PermissionFlagsBits,
  WebhookMessageCreateOptions,
  APIWebhook,
  WebhookClient,
  Routes,
  Message,
  WebhookMessageEditOptions,
  BaseChannel,
  APIMessage,
  MessageCreateOptions,
  MessagePayload,
} from "discord.js";
import client from "../../saphire";
import { isDiscordId } from "../../util/validators";
import Logger from "./logger";
import { channelType } from "./types";

export default class GlobalSystemNotification extends Logger {

  webhookCache = new Map<string, Webhook<WebhookType.Incoming>>();
  webhookClientCache = new Map<string, WebhookClient>();
  payloads: Record<string, (MessageCreateOptions | MessagePayload)[]> = {};
  timers: Record<string, NodeJS.Timeout> = {};

  super() { }

  get reason() {
    return `${client.user?.username}'s Global System Notification`;
  }

  hasWebhook(channelId: string): boolean {
    return this.webhookCache.has(channelId);
  }

  getWebhook(channelId: string): Webhook<WebhookType.Incoming> | null {
    return this.webhookCache.get(channelId) || null;
  }

  getWebhookClient(url: string): WebhookClient | undefined {
    return this.webhookClientCache.get(url);
  }

  async fetchWebhook(channel: Channel): Promise<Webhook<WebhookType.Incoming> | null>
  async fetchWebhook(channel: Channel, createIfNotExist: boolean, options?: { username?: string, avatar?: string, reason?: string }): Promise<Webhook<WebhookType.Incoming> | null>
  async fetchWebhook(channel: Channel, createIfNotExist?: boolean, options?: { username?: string, avatar?: string, reason?: string }): Promise<Webhook<WebhookType.Incoming> | null> {
    if (!channel) return null;

    if (this.hasWebhook(channel.id))
      return this.getWebhook(channel.id)!;

    if (
      !channel?.client.isReady()
      || !("createWebhook" in channel && "fetchWebhooks" in channel)
      || !channel.permissionsFor(channel.client.user.id)?.has(PermissionFlagsBits.ManageWebhooks)
    ) return null;

    const webhooks = await channel.fetchWebhooks()
      .catch(() => {
        this.webhookCache.delete(channel.id);
        return null;
      });

    const webhook = (
      webhooks?.find(webhook =>
        webhook.owner?.id === channel.client.user.id && webhook.isIncoming(),
      ) || null
    ) as Webhook<WebhookType.Incoming> | null;

    if (webhook)
      this.webhookCache.set(channel.id, webhook);

    if (!webhook && createIfNotExist)
      return await this.createWebhook(channel, options);

    return webhook;
  }

  async fetchWebhookThroughAPIByURL(url: string): Promise<WebhookClient | undefined | void> {

    if (this.webhookClientCache.has(url))
      return this.webhookClientCache.get(url)!;

    const res = await fetch(url)
      .then(res => res.json())
      .catch(() => null) as APIWebhook | null;

    if (!res?.url) return;

    try {
      const webhook = new WebhookClient({ url: res?.url });;
      this.webhookClientCache.set(url, webhook);
      return webhook;
    } catch (_) { }
  }

  async findWebhookThroughAPI(channelId: string): Promise<WebhookClient | undefined | void> {

    if (this.webhookClientCache.has(channelId))
      return this.webhookClientCache.get(channelId)!;

    const webhooks = await client.rest.get(Routes.channelWebhooks(channelId)).catch(() => []) as APIWebhook[];

    if (webhooks?.length && Array.isArray(webhooks)) {
      const webhook = webhooks.find(w => w?.user?.id === client.user!.id);
      if (webhook) {
        const wh = new WebhookClient({
          url: webhook.url || `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`,
        });

        this.webhookClientCache.set(channelId, wh)!;
        return wh;
      }
    }

    return;
  }

  async createWebhook(channel: Channel, options?: { name?: string, avatar?: string, reason?: string }): Promise<Webhook<WebhookType.Incoming> | null> {

    if (!channel?.client.isReady()) return null;
    if (!("createWebhook" in channel && "fetchWebhooks" in channel)) return null;
    if (!channel.permissionsFor(channel.client.user.id, true)?.has(PermissionFlagsBits.ManageWebhooks)) return null;

    return await channel.createWebhook({
      avatar: options?.avatar || channel.client.user.displayAvatarURL(),
      name: options?.name || channel.client.user.displayName,
      reason: options?.reason || this.reason,
    }).catch(err => {
      console.log(err);
      return null;
    });
  }

  async createWebhookThroughAPI(channelId: string, body: { name: string, avatar: string }): Promise<WebhookClient | undefined> {
    const res = await client.rest.post(Routes.channelWebhooks(channelId), { body }).catch(() => null) as APIWebhook | null;

    if (!res?.id || !res?.token) return;

    const wehbook = new WebhookClient({
      url: res?.url || `https://discord.com/api/webhooks/${res.id}/${res.token}`,
    });

    this.webhookClientCache.set(channelId, wehbook)!;
    return wehbook;
  }

  async sendMessage(
    options: string | WebhookMessageCreateOptions,
    channel: Channel | GuildBasedChannel | GuildTextBasedChannel | undefined, webhook?: WebhookClient,
  ): Promise<APIMessage | null> {
    if (!channel?.isSendable()) return null;

    const wh = webhook || await this.fetchWebhook(channel);

    if (wh) {
      if (typeof options === "string") options = { content: options };
      options.avatarURL ??= channel.client.user.displayAvatarURL();
      options.username ??= channel.client.user.displayName;

      return await wh.send(options)
        .then(msg => {

          if (msg instanceof Message)
            return msg.toJSON() as APIMessage;

          return msg;
        })
        .catch(() => null);
    }

    return await channel.send(options)
      .then(msg => msg.toJSON() as APIMessage)
      .catch(() => null);

  }

  async deleteWebhook(channel: Channel): Promise<boolean> {

    this.webhookCache.delete(channel.id);
    this.webhookClientCache.delete(channel.id)!;

    const webhook = await this.fetchWebhook(channel);
    if (!webhook) return false;

    this.webhookClientCache.delete(webhook.url)!;

    return await webhook.delete(this.reason)
      .then(() => true)
      .catch(() => false) || false;

  }

  async editWebhookMessage(message: Message, options: string | WebhookMessageEditOptions): Promise<Message<boolean> | undefined>
  async editWebhookMessage(channel: Channel, messageId: string, options: string | WebhookMessageEditOptions): Promise<Message<boolean> | undefined>
  async editWebhookMessage(
    channel: Channel | Message,
    message: Message | string | WebhookMessageEditOptions,
    options?: string | WebhookMessageEditOptions,
  ) {
    if (channel instanceof BaseChannel && options) {
      if (!isDiscordId(message)) return;
      return await this.editWebhookMessage2(channel, message, options);
    }

    if (channel instanceof Message && !options)
      return await this.editWebhookMessage2(channel.channel, channel.id, message as string);
  }

  async editWebhookMessage2(
    channel: Channel,
    messageId: string,
    options: string | WebhookMessageEditOptions,
  ) {
    if (!channel?.isSendable()) return;

    const webhook = await this.fetchWebhook(channel);

    try {
      if (webhook) return await webhook?.editMessage(messageId, options);
      return await channel.messages.edit(messageId, options);
    } catch (_: any) { }
  }

  isMessageResolvable<T extends MessageResolvable>(message: T): message is T
  isMessageResolvable(message: unknown): message is MessageResolvable
  isMessageResolvable(message: unknown) {
    if (typeof message === "string") return isDiscordId(message);
    return message instanceof Message;
  }

  isWebhookChannel(channel: Channel) {
    return "createWebhook" in channel && "fetchWebhooks" in channel;
  }

  async sendWebhookByURL(payload: WebhookMessageCreateOptions, url: string) {
    let webhook = this.getWebhookClient(url);

    if (!webhook) {
      webhook = new WebhookClient({ url });
      this.webhookClientCache.set(url, webhook);
    }

    return await webhook.send({
      avatarURL: payload.avatarURL || client.user?.displayAvatarURL(),
      username: payload.username || client.user?.displayName,
      ...payload,
    })
      .catch(() => { });
  }

  async setPayloadToSendWithClient(channel: channelType, payload: MessageCreateOptions | MessagePayload) {

    if (!this.payloads[channel.id]) this.payloads[channel.id] = [];
    this.payloads[channel.id]!.push(payload);

    return await this.sendMessageWithClient(channel);
  }

  private async sendMessageWithClient(channel: channelType) {

    if (!this.payloads[channel.id]?.length) return this.clearPayloadAndTimer(channel.id);

    this.timers[channel.id] ??= setTimeout(() => {
      delete this.timers[channel.id];
      this.sendPayload(channel);
    }, 1000);

    return;
  }

  private async sendPayload(channel: channelType) {

    const payload = this.payloads[channel.id] || [];
    if (!payload.length) return this.clearPayloadAndTimer(channel.id);

    const data = this.payloads[channel.id]?.splice(0, 1);

    await channel.send(data[0])
      .catch(async () => {
        this.clearPayloadAndTimer(channel.id);
        // return await disable(channel.guild.id, "ban", "Fail to send log");
      });

    if ((this.payloads[channel.id] || []).length)
      return await this.sendMessageWithClient(channel);

    return this.clearPayloadAndTimer(channel.id);
  }

  private clearPayloadAndTimer(channelId: string) {
    clearTimeout(this.timers[channelId]);
    delete this.timers[channelId];
    delete this.payloads[channelId];
  }

}