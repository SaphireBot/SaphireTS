import { AutocompleteInteraction } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import { GiveawaySchemaType } from "../../database/schemas/giveaway";
import { GiveawayType } from "../../@types/database";
import Giveaway from "../../structures/giveaway/giveaway";

export default class GiveawayManager {
  twentyDays = 1000 * 60 * 60 * 24 * 20;
  cache = new Map<string, Giveaway>();
  constructor() { }

  async load(guildIds?: string[]): Promise<void> {

    if (!guildIds?.length) return;

    const giveaways: GiveawayType[] = await Database.Giveaways.find({ GuildId: { $in: guildIds } });

    this.filterAndManager(giveaways);
    return;
  }

  async set(giveaway: GiveawayType | GiveawaySchemaType): Promise<Giveaway | void> {
    if (!giveaway?.MessageID) return;
    if (this.cache.has(giveaway.MessageID)) return this.cache.get(giveaway.MessageID);
    const GiveawayInstance = await new Giveaway(giveaway).load();
    if (!GiveawayInstance) return;
    this.cache.set(giveaway.MessageID, GiveawayInstance);
    return GiveawayInstance;
  }

  async autocomplete(interaction: AutocompleteInteraction, search: string): Promise<void> {
    if (!interaction.guildId) return await interaction.respond([{ name: "Nenhum sorteio foi encontrado", value: "ignore" }]);
    const giveaways = await this.getGiveawaysFromAGuild(interaction.guildId);
    if (!giveaways.length) return await interaction.respond([{ name: "Nenhum sorteio foi encontrado", value: "ignore" }]);

    const value = search?.toLowerCase();
    const data = giveaways
      .filter(gw => {
        return gw.Prize?.toLowerCase()?.includes(value)
          || gw.channel?.name?.toLowerCase()?.includes(value)
          || gw.Winners === parseInt(value)
          || gw.Participants.size === parseInt(value)
          || gw.MessageID.includes(value);
      })
      .map(gw => ({
        name: `${gw.Participants.size} 👥 | 💬 ${gw.channel?.name} | ⭐ ${gw.Prize}`.limit("ApplicationCommandChoiceName"),
        value: `${gw.MessageID}`,
      }));

    if (data.length > 25) data.length = 25;
    return await interaction.respond(data?.length ? data : [{ name: "Nenhum sorteio foi encontrado", value: "ignore" }]);
  }

  filterAndManager(giveaways: GiveawayType[]): void {
    if (!giveaways?.length) return;

    for (const giveaway of giveaways)
      this.set(giveaway);

    return;
  }

  clearTimeout(messageID: string): void {
    return clearTimeout(this.cache.get(messageID)?.timeout);
  }

  async deleteGiveawayFromDatabase(MessageID: string, GuildId: string): Promise<void> {

    if (!GuildId || !MessageID) return;

    this.clearTimeout(MessageID);

    await Database.Giveaways.deleteOne({ MessageID, GuildId });

    return;
  }

  async deleteAllGiveawaysFromThisGuild(GuildId: string): Promise<void> {

    for (const giveaway of this.cache)
      if (giveaway[1].GuildId === GuildId) {
        this.clearTimeout(giveaway[1].MessageID);
        this.cache.delete(giveaway[1].MessageID);
      }

    await Database.Giveaways.deleteMany({ GuildId });

    return;
  }

  async deleteAllGiveawaysFromThisChannel(ChannelId: string): Promise<void> {

    const giveaways = await this.getGiveawaysFromAChannel(ChannelId);

    for (const giveaway of giveaways)
      if (giveaway.ChannelId === ChannelId) {
        this.clearTimeout(giveaway.MessageID);
        this.cache.delete(giveaway.MessageID);
      }

    await Database.Giveaways.deleteMany({ ChannelId });

    return;
  }

  deleteMultiples(giveawaysId: string[]): void {
    for (const giveawayId of giveawaysId) this.delete(giveawayId);
  }

  async removeThisMemberFromAllGiveaways(userId: string, GuildId: string): Promise<void> {
    const giveaways = await this.getGiveawaysFromAGuild(GuildId);
    if (giveaways.length) return;
    for (const giveaway of giveaways) giveaway.removeParticipant(userId);

    await Database.Giveaways.updateMany(
      { GuildId },
      { $pull: { Participants: userId } },
    );

    return;
  }

  async delete(MessageId: string): Promise<void> {
    if (!MessageId) return;

    const giveaway = this.cache.get(MessageId);
    if (!giveaway) return;

    if (!giveaway.MessageLink?.includes("/")) return;
    const linkBreak = giveaway?.MessageLink?.split("/") || [];

    if (!linkBreak || !linkBreak?.length)
      return this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

    const channelId = linkBreak.at(-2);
    if (!channelId) return;

    const message = await giveaway.getMessage();
    if (!message) return;

    const components: any = message?.components?.[0]?.toJSON();

    if (!message?.id || !components)
      return await this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

    if (components && components?.components[0]) {
      components.components[0].disabled = true;
      components.components[1].disabled = true;
    }

    const embed = message?.embeds[0];
    if (!embed || !components?.components[0])
      return await this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

    const field = embed.fields?.find(fild => fild?.name?.includes(e.Trash));
    if (field) field.value = t("giveaway.expired", giveaway.guild?.preferredLocale);

    await this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);
    await message.edit({ embeds: [embed], components: [components] });
    return;
  }

  async getGiveawaysFromAChannel(ChannelId: string): Promise<Giveaway[]> {
    return Object.values(this.cache).filter(gw => gw?.ChannelId === ChannelId);
  }

  async fetchGiveaway(GuildId: string, MessageID: string): Promise<GiveawayType | void | null | undefined> {
    if (!GuildId || !MessageID) return;
    return await Database.Giveaways.findOne({ MessageID, GuildId });
  }

  async fetchGiveawaysFromAGuild(GuildId: string): Promise<GiveawayType[]> {
    return await Database.Giveaways.find({ GuildId });
  }

  getGiveawaysFromAGuild(GuildId: string): Giveaway[] {
    return Array.from(this.cache.values()).filter((giveaway) => giveaway.GuildId === GuildId);
  }

  async fetchGiveawayFromAnUser(userId: string): Promise<GiveawayType[]> {
    return await Database.Giveaways.find(
      { Participants: { $in: [userId] } },
    );
  }

}