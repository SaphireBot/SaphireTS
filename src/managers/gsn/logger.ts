import { embedLength, isJSONEncodable, type SendableChannels } from "discord.js";
import { type LogSystemPayload } from "./types";
import { DiscordStringLimits } from "djs-protofy";
import { GlobalSystemNotificationManager } from "..";

const TIMEOUT_MS = 1_000;
const PAYLOAD_LIMIT = 10;

export default class Logger {
  static #instance: Logger;
  static get instance() { return new this(); }

  static send(channel: SendableChannels, payload: LogSystemPayload) {
    return Logger.instance.setPayloadToSendWithWebhook(channel, payload);
  }

  constructor() { return Logger.#instance ??= this; }

  readonly #payloadCache: Record<string, LogSystemPayload[]> = {};
  readonly #timeoutCache: Record<string, NodeJS.Timeout | null> = {};

  setPayloadToSendWithWebhook(channel: SendableChannels, payload: LogSystemPayload) {
    const cached = this.#payloadCache[channel.id] ??= [];

    cached.push(payload);

    this.#timeoutCache[channel.id] ??= setTimeout(() => {
      delete this.#timeoutCache[channel.id];
      this.#send(channel, cached);
    }, TIMEOUT_MS);
  }

  async #send(channel: SendableChannels, cached: LogSystemPayload[]) {
    if (!cached.length) return;

    const options: Required<LogSystemPayload> = { embeds: [], files: [] };

    let i = 0, embedCount = 0, fileCount = 0, textLength = 0;
    for (; i < cached.length; i++) {
      const option = cached[i]!;

      const curEmbedCount = option.embeds?.length ?? 0;
      const curFileCount = option.files?.length ?? 0;

      if (
        (embedCount += curEmbedCount) > PAYLOAD_LIMIT
        || (fileCount += curFileCount) > PAYLOAD_LIMIT
      ) break;

      if (curEmbedCount) {
        const curTextLength = option.embeds!.reduce((p, c) =>
          p + embedLength(isJSONEncodable(c) ? c.toJSON() : c), 0);

        if ((textLength += curTextLength) > DiscordStringLimits.MessageTotal) break;

        options.embeds.push(...option.embeds!);
      }

      if (curFileCount) options.files.push(...option.files!);
    }

    cached.splice(0, i);

    try {
      await GlobalSystemNotificationManager.sendMessage(options, channel);
    } catch (error: any) {
      console.log(error);
    } finally {
      setTimeout(() => {
        const cached = this.#payloadCache[channel.id];
        if (cached && !cached.length) delete this.#payloadCache[channel.id];
      }, TIMEOUT_MS);
    }
  }
}