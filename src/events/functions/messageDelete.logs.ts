import { APIEmbed, APIEmbedField, AuditLogEvent, Colors, Message, PartialMessage, PermissionsBitField, NewsChannel, StageChannel, TextChannel, PublicThreadChannel, PrivateThreadChannel, VoiceChannel } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import client from "../../saphire";
import { Config } from "../../util/constants";
import { e } from "../../util/json";

type guildChannel = NewsChannel | StageChannel | TextChannel | PublicThreadChannel<boolean> | PrivateThreadChannel | VoiceChannel;

// logsId
const logsCount = new Map<string, number>();
const timers: Record<string, NodeJS.Timeout | undefined> = {};

const debounceData: Record<
  string,
  {
    debouncer?: (channel: guildChannel) => any,
    embeds?: APIEmbed[]
  }
> = {};

export default async function messageDeleteLogs(message: Message | PartialMessage) {

  if (
    !message
    || message.partial
    || !message.guild
    || !message.channel
    || !message.guildId
    || message.webhookId
    || message.system
    || message.author?.bot
    || !message.author
    || !message.content?.length
  ) return;

  const { guildId, author, content, channel: channelOrigin, guild } = message;

  if (
    !guild.members.me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)
    || !guild.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)
  ) return await disableSystem("No permissions - Visualizar Audit Logs | Enviar Mensagens");

  const data = await Database.getGuild(guildId);
  const log = data?.Logs?.messages;
  if (!log) return;

  const { channelId, active, messageDelete } = log;
  if (!channelId || !active || !messageDelete) return;

  const channel = await guild?.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) return await disableSystem("No channel found");

  let locale = guild.preferredLocale;
  if (!Config.locales.includes(locale)) locale = client.defaultLocale as any;

  let entry = await guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.MessageDelete })
    .then(res => res.entries.find(entry => entry.targetId === author.id))
    .catch(() => undefined);

  if (entry) {
    const oldCount = (logsCount.get(entry.id) || 0) || await Database.Cache.get(`Logs.${guildId}.MessageDelete.${entry.targetId}.${entry.id}`) || 0;
    if (entry.extra.count === oldCount) entry = undefined;
    else if (entry.extra.count > oldCount) await cacheLog(entry, guildId);
  }

  const executor = entry?.executor;
  if (executor?.bot) return;

  const fields: APIEmbedField[] = [];

  if (content.length <= 1024)
    fields.push({
      name: t("logs.messages.embed.field_content_name", locale),
      value: content.limit("EmbedFieldValue"),
    });

  const embeds: APIEmbed[] = [{
    color: Colors.Blue,
    title: t("logs.messages.embed.title_deleted", locale),
    description: t("logs.messages.embed.description_deleted", { e, locale, channelOrigin, executor, author }),
    fields,
    thumbnail: { url: author?.displayAvatarURL() || "" },
    timestamp: new Date().toISOString(),
  }];

  if (!executor || executor.id === author.id) {
    delete embeds[0].thumbnail;
    embeds[0].author = {
      name: t("logs.messages.embed.author_self_delete", { author, locale }),
      icon_url: author?.displayAvatarURL(),
    };
    delete embeds[0].title;
    embeds[0].description = t("logs.messages.embed.description_self_delete", { author, locale, channelOrigin });
  }

  if (content.length > 1024) {
    delete embeds[0].timestamp;
    embeds.push({
      color: Colors.Blue,
      title: t("logs.messages.embed.field_content_name", locale),
      description: content.limit("EmbedDescription"),
      timestamp: new Date().toISOString(),
    });
  }

  if (!debounceData[channel.id]) debounceData[channel.id] = {};

  if (debounceData[channel.id]?.embeds?.length)
    debounceData[channel.id].embeds!.push(embeds[0]);
  else debounceData[channel.id].embeds = embeds;

  return (
    debounceData[channel.id]?.debouncer
    || (() => {
      const bounce = debounce(sendMessageLog, 2000);
      debounceData[channel.id].debouncer = bounce;
      return bounce;
    })()
  )(channel);

}

async function sendMessageLog(channel: guildChannel) {
  if (!channel) return;

  const embeds = debounceData[channel.id]?.embeds || [];
  delete debounceData[channel.id];

  if (!embeds?.length) return;
  if (embeds.length > 10) {
    for (let i = 0; i < 10; i += 10) {
      await channel.send({ embeds: embeds.slice(i, i + 10) })
        .catch(async err => await disableSystem(channel.guildId, `${err}`));
      await sleep(1500);
    }
    return;
  }

  return await channel.send({ embeds })
    .catch(async err => await disableSystem(channel.guildId, `${err}`));

}

async function disableSystem(guildId: string, reason?: string) {
  // TODO: Send a message by GSN system
  return await Database.Guilds.updateOne(
    { id: guildId },
    { "Logs.messages.channelId": null },
    { upsert: true },
  );

  if (reason) {
    // TODO: send to GSN
  }
}

function debounce<F extends (channel: guildChannel) => ReturnType<F>>(
  func: F,
  ms: number,
): (channel: guildChannel) => any {
  let timeout: NodeJS.Timeout;

  return (channel: guildChannel): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(channel), ms);
    return;
  };
}

async function cacheLog(entry: any, guildId: string) {
  logsCount.set(entry.id, entry.extra.count);
  clearTimeout(timers[entry.id]);
  timers[entry.id] = setTimeout(async () => {
    logsCount.delete(entry.id);
    delete timers[entry.id];
    await Database.Cache.delete(`Logs.${guildId}.MessageDelete.${entry.targetId}.${entry.id}`);
  }, (1000 * 60) * 5);
  await Database.Cache.set(`Logs.${guildId}.MessageDelete.${entry.targetId}.${entry.id}`, entry.extra.count);
}