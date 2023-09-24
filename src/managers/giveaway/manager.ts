import { Routes, APIMessage } from "discord.js";
import { GuildSchema } from "../../database/models/guild";
import client from "../../saphire";
import Database from "../../database";
import Giveaway from "../../structures/giveaway/giveaway";

export type GiveawayType = GuildSchema["Giveaways"][0] & {
    timeout?: NodeJS.Timeout
    DateNow: number
    TimeMs: number
    MessageID: string
    ChannelId: string
    GuildId: string
};

export default class GiveawayManager {
    twentyDays = 1000 * 60 * 60 * 24 * 20;
    cache = new Map<string, Giveaway>();
    constructor() { }

    async load(guildsData: GuildSchema[]) {

        if (!guildsData?.length) return;

        client.on("deleteGiveaway", async (guildId: string, messageId: string): Promise<any> => {
            return this.deleteGiveawayFromDatabase(messageId, guildId);
        });
        const allGiveaways = guildsData
            .filter(data => data?.Giveaways?.length > 0)
            .flatMap(data => data?.Giveaways)
            .filter(i => i);

        this.filterAndManager(allGiveaways as any);
        return;
    }

    async set(giveawayData: GiveawayType) {
        if (!giveawayData?.MessageID) return;
        const giveaway = await new Giveaway(giveawayData).load();
        this.cache.set(giveawayData.MessageID, giveaway);
        return giveaway;
    }

    async filterAndManager(giveaways: GiveawayType[]) {
        if (!giveaways?.length) return;

        for (const giveawayData of giveaways)
            this.set(giveawayData);

        return;
    }

    clearTimeout(messageID: string) {
        return clearTimeout(this.cache.get(messageID)?.timeout);
    }

    async deleteGiveawayFromDatabase(messageID: string, guildId: string, all?: boolean, byChannelId?: string) {

        if (!guildId) return;
        if (byChannelId) return this.deleteAllGiveawaysFromThisChannel(byChannelId);
        if (all) return this.deleteAllGiveawaysFromThisGuild(guildId);

        if (!messageID) return;

        this.clearTimeout(messageID);

        await Database.Guilds.updateOne(
            { id: guildId },
            { $pull: { Giveaways: { MessageID: messageID } } }
        );
        return;
    }

    async deleteAllGiveawaysFromThisGuild(guildId: string, fromGuildDelete?: boolean) {

        for (const giveaway of this.cache)
            if (giveaway[1].GuildId === guildId) {
                this.clearTimeout(giveaway[1].MessageID);
                this.cache.delete(giveaway[1].MessageID);
            }

        if (!fromGuildDelete)
            await Database.Guilds.updateOne({ id: guildId }, { $unset: { Giveaways: 1 } });
        return;
    }

    async deleteAllGiveawaysFromThisChannel(channelId: string) {

        let guildId: string | undefined;

        for (const giveaway of Object.values(this.cache).filter((d) => d.ChannelId === channelId))
            if (giveaway.ChannelId === channelId) {
                if (!guildId) guildId = giveaway.GuildId;
                this.clearTimeout(giveaway.MessageID);
                this.cache.delete(giveaway.MessageID);
            }

        if (guildId)
            return await Database.Guilds.updateOne({ id: guildId }, { $pull: { Giveaways: { ChannelId: channelId } } });
        return;
    }

    deleteMultiples(giveawaysId: string[]) {
        for (const giveawayId of giveawaysId) this.delete(giveawayId);
    }

    async delete(messageId: string) {
        if (!messageId) return;
        const giveaway = this.cache.get(messageId);
        if (!giveaway) return;

        if (!giveaway.MessageLink?.includes("/")) return;
        const linkBreak = giveaway?.MessageLink?.split("/") || [];

        if (!linkBreak || !linkBreak?.length)
            return this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

        const channelId = linkBreak.at(-2);
        if (!channelId) return;

        const message = await client.rest.get(Routes.channelMessage(channelId, giveaway.MessageID)).catch(() => null) as APIMessage | null;
        if (!message) return;

        const components = message?.components;

        if (!message?.id || !components || !components.length)
            return this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

        if (components && components[0]?.components[0]) {
            components[0].components[0].disabled = true;
            components[0].components[1].disabled = true;
        }

        const embed = message?.embeds[0];
        if (!embed || !components[0]?.components[0])
            return this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

        const field = embed.fields?.find(fild => fild?.name?.includes("Exclusão"));
        if (field) field.value = "Tempo expirado (+20d)";

        this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);
        return await client.rest.patch(
            Routes.channelMessage(channelId, giveaway.MessageID),
            { body: { components, embeds: [embed] } }
        ).catch(() => { });
    }

    getGiveawaysFromAChannel(channelId: string): Giveaway[] | void {
        if (channelId)
            return Object.values(this.cache)
                .filter(gw => gw?.ChannelId === channelId);
        return;
    }

    async fetchGiveaway(guildId: string, giveawayId: string): Promise<GiveawayType | void> {
        if (!guildId || !giveawayId) return;
        const guildData = await Database.getGuild(guildId);
        if (!guildData) return;
        return guildData.Giveaways?.find(gw => gw?.MessageID === giveawayId) as GiveawayType;
    }
}