import Database from "../../database";
import { GuildSchemaType } from "../../database/schemas/guild";
import client from "../../saphire";
import experience from "../experience/experience";
import { channelSendPayload } from "./message.payload";
import enableMysticalChestCollector from "./collector";

export default class MysticalTravelingChest {

  guilds = new Set<string>();
  channelsUnavailable = new Set<string>();

  //             guildId      channelId  points
  counter: Record<string, Record<string, number>> = {};

  constructor() { }

  async load(guildDocs: GuildSchemaType[]) {

    setInterval(() => this.execute(), 1000 * 60 * 60);

    if (!guildDocs?.length) return;
    for (const guild of guildDocs)
      if (guild?.Chest) this.guilds.add(guild.id!);

  }

  addMysticalPoint(guildId: string, channelId: string) {

    if (
      this.channelsUnavailable.has(channelId)
      || !this.guilds.has(guildId)
    ) return;

    if (!this.counter[guildId]) this.counter[guildId] = {};
    return this.counter[guildId][channelId]
      ? this.counter[guildId][channelId]++
      : this.counter[guildId][channelId] = 1;
  }

  execute() {
    const channelsId = this.selectChannels();
    this.sendMysticalChest(channelsId);
    this.counter = {};
  }

  async sendMysticalChest(channelIds: string[]) {

    for await (const channelId of channelIds) {
      const channel = client.channels.cache.get(channelId);

      if (
        !channel
        || channel.isDMBased()
        || !channel.isSendable()
      ) {
        this.channelsUnavailable.add(channelId);
        continue;
      }

      await channel.send(
        channelSendPayload(channel.guild.preferredLocale || client.defaultLocale),
      )
        .then(enableMysticalChestCollector)
        .catch(() => this.channelsUnavailable.add(channelId));

      continue;

    }

    return;

  }

  async setPrize(userId: string, value: number, exp: number) {

    await Database.editBalance(
      userId,
      {
        createdAt: new Date(),
        method: "add",
        mode: "chest",
        keywordTranslate: "chest.transactions.gain",
        type: "gain",
        value,
      },
    );

    experience.add(userId, exp);
    return;
  }

  get prize() {
    const prize = {
      coins: Math.floor(Math.random() * 50000),
      exp: Math.floor(Math.random() * 4000),
    };

    if (prize.coins < 1000) prize.coins = 1000;
    if (prize.exp < 500) prize.exp = 500;
    return prize;
  }

  selectChannels() {

    const data = [];
    for (const guildId of Object.keys(this.counter)) {
      const channelsData = Object.entries(this.counter[guildId] || {}).filter(data => (data[1] || 0) >= 1000);
      if (!channelsData.length) continue;
      data.push(channelsData.sort((a, b) => b[1] - a[1])[0]);
      continue;
    }

    if (!data.length) return [];
    const fill = data.filter(i => i) || [];
    if (!fill.length) return [];
    return fill.sort((a, b) => b[1] - a[1]).slice(0, 5).map(arr => arr[0]);
  }

  async getState(guildId: string) {
    return await Database.getGuild(guildId)
      .then(data => data?.Chest || false);
  }

  async enable(guildId: string) {
    this.guilds.add(guildId);
    return await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $set: { Chest: true } },
      { upsert: true, new: true },
    );
  }

  async disable(guildId: string) {
    this.guilds.delete(guildId);
    delete this.counter[guildId];

    return await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $set: { Chest: false } },
      { upsert: true, new: true },
    );
  }

  async toggle(guildId: string) {

    const state = await this.getState(guildId);

    if (state) {
      this.guilds.delete(guildId);
      delete this.counter[guildId];
    } else {
      this.guilds.add(guildId);
      this.counter[guildId] = {};
    }

    return await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $set: { Chest: !state } },
      { upsert: true, new: true },
    );
  }

}