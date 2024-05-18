import { APIEmbed, Colors, GuildEmoji, Message, MessageReaction, TextChannel } from "discord.js";
import Database from "../../database";
import { GuildSchemaType } from "../../database/schemas/guild";

export default class PearlsManager {

  // guildId
  data = new Map<string, { limit: number, channelId: string, emoji: string }>();
  min = 1;
  max = 1000;
  count = {} as Record<string, Record<string, number>>; // { guildId: { userId: count } }
  timeout = {} as Record<string, NodeJS.Timeout>;

  constructor() { }

  async load(guilds: GuildSchemaType[]) {

    for await (const guild of guilds) {
      const pearl = guild.Pearls!;
      const count = pearl.count as Record<string, number>;
      const timeout = pearl.timeout as Record<string, number>;
      if (!this.count[guild.id!]) this.count[guild.id!] = {};

      if (timeout)
        for (const [id, time] of Object.entries(timeout)) {
          let remaining = time - Date.now();
          if (remaining < 0) remaining = 1;
          this.timeout[id] = setTimeout(() => this.removeTimeout(guild.id!, id), remaining);
        }

      if (count)
        for (const [userId, pearls] of Object.entries(count))
          this.count[guild.id!][userId] = (this.count[guild.id!][userId] || 0) + pearls;

      if (typeof guild.Pearls?.limit === "number") {

        if (
          !pearl.limit
          || pearl.limit > this.max
          || pearl.limit < this.min
          || !pearl.channelId
        ) {
          await this.disable(guild.id!);
          continue;
        }

        this.data.set(guild.id!, { channelId: pearl.channelId, limit: pearl.limit, emoji: pearl.emoji || "⭐" });
        continue;
      }

      continue;

    }
  }

  async emojisDelete(emoji: GuildEmoji) {
    const data = this.data.get(emoji.guild!.id);
    if (!data || data.emoji !== emoji.toString()) return;
    return await this.disable(emoji.guild.id);
  }

  async guildDelete(guildId: string) {
    const data = this.data.get(guildId);
    if (!data) return;
    return await this.disable(guildId);
  }

  async channelDelete(guildId: string, channelId: string) {
    const data = this.data.get(guildId);
    if (!data || data.channelId !== channelId) return;
    return await this.disable(guildId);
  }

  get(guildId: string) {
    return this.data.get(guildId);
  }

  async set(guildId: string, limit: number, channelId: string, emoji: string): Promise<true | Error | string> {
    if (limit > this.max) return "Max limit range exceeded";
    if (limit < this.min) return "Min limit range exceeded";
    if (!emoji) return "No emoji given";
    if (!channelId) return "No channelId given";

    this.data.set(guildId, { limit, channelId, emoji });
    return await Database.Guilds.updateOne(
      { id: guildId },
      {
        $set: {
          "Pearls.limit": limit,
          "Pearls.channelId": channelId,
          "Pearls.emoji": emoji
        }
      },
      { upsert: true }
    )
      .then(() => true)
      .catch(err => err);
  }

  async disable(guildId: string) {
    this.data.delete(guildId);
    const data = await Database.getGuild(guildId);
    const timeout = data?.Pearls?.timeout as Record<string, number> | undefined;

    if (timeout)
      for (const id of Object.keys(timeout)) {
        clearTimeout(this.timeout[id]);
        delete this.timeout[id];
      }

    return await Database.Guilds.updateOne(
      { id: guildId },
      {
        $set: { "Pearls.limit": 0 },
        $unset: {
          "Pearls.channelId": true,
          "Pearls.emoji": true,
          "Pearls.timeout": true
        }
      }
    );
  }

  async setEmoji(guildId: string, emoji: string) {
    const data = this.data.get(guildId);
    if (!data) return;

    data.emoji = emoji;
    this.data.set(guildId, data);

    return await Database.Guilds.updateOne(
      { id: guildId },
      { $set: { "Pearls.emoji": emoji } },
      { upsert: true }
    );
  }

  async theUserLeaveFromThisGuild(guildId: string, userId: string) {
    await Database.Guilds.updateOne(
      { id: guildId },
      { $unset: { [`Pearls.count.${userId}`]: true } },
      { upsert: true }
    );
  }

  async removeTimeout(guildId: string, messageId: string) {

    if (this.timeout[messageId]) {
      clearTimeout(this.timeout[messageId]);
      delete this.timeout[messageId];
    }

    await Database.Guilds.updateOne(
      { id: guildId },
      {
        $unset: {
          [`Pearls.timeout.${messageId}`]: true
        }
      },
      { upsert: true }
    );
  }

  async analizeBeforeSend(reaction: MessageReaction) {

    const { users } = reaction;
    const message = reaction.message as Message<true>;
    const data = this.data.get(message.guildId!)!;
    const guild = message.guild!;
    const author = message.author!;

    const usersThatReact = await users.fetch().catch(() => null);
    if (!usersThatReact || !usersThatReact.size) return;

    const available = usersThatReact.filter(u => !u.bot);
    if (available.size < data.limit) return;

    const channel = await guild?.channels.fetch(data.channelId).catch(() => null) as TextChannel | null;
    if (!channel) return await this.disable(guild!.id);

    const count = ((await Database.getGuild(guild.id)).Pearls?.count?.[author!.id] || 0) + 1;
    const content = `${data.emoji} **${count}** | ${message.url}`;
    const embed: APIEmbed = {
      color: Colors.Blue,
      author: {
        name: author.displayName,
        icon_url: author.displayAvatarURL()
      },
      timestamp: new Date() as any
    };
    const files: any[] = [];

    if (message.content?.length)
      embed.description = message.content.limit("EmbedDescription");

    if (message.attachments.size) {

      if (message.attachments.size === 1) {
        const attach = message.attachments.first()!;

        if (attach.contentType?.includes("image")) {
          files.push(attach.url);
          embed.image = {
            url: `attachment://${attach!.name}`
          };
        } else files.push(attach);
      }
      else
        for (const attach of message.attachments.values())
          files.push(attach);

    }

    const ok = await this.send(channel, content, [embed], files);
    if (!ok) return;
    return this.addPearl(guild.id, author.id, message.id);
  }

  async send(channel: TextChannel, content: string, embeds: APIEmbed[], files: any[]): Promise<boolean> {
    return await channel.send({
      content,
      embeds,
      files
    })
      .then(() => true)
      .catch(() => false);
  }

  async addPearl(guildId: string, authorId: string, messageId: string) {
    if (!this.count[guildId]) this.count[guildId] = { authorId: 0 };
    this.count[guildId][authorId] = (this.count[guildId][authorId] || 0) + 1;
    this.timeout[messageId] = setTimeout(() => this.removeTimeout(guildId, messageId), (1000 * 60 * 60 * 12));

    return await Database.Guilds.updateOne(
      { id: guildId },
      {
        $inc: { [`Pearls.count.${authorId}`]: 1 },
        $set: { [`Pearls.timeout.${messageId}`]: Date.now() + (1000 * 60 * 60 * 12) }
      },
      { upsert: true }
    );
  }
}