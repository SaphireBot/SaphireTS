import { AutocompleteInteraction } from "discord.js";
import { GuildSchemaType } from "../../database/schemas/guild";
import Database from "../../database";
import Giveaway from "../../structures/giveaway/giveaway";
import { t } from "../../translator";
import { e } from "../../util/json";

export type GiveawayType = GuildSchemaType["Giveaways"][0] & {
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

    async load(guildsData: GuildSchemaType[]) {

        if (!guildsData?.length) return;

        const allGiveaways = guildsData
            .filter(data => data?.Giveaways?.length > 0)
            .flatMap(data => data?.Giveaways)
            .filter(i => i);

        this.filterAndManager(allGiveaways as any);
        return;
    }

    async set(giveaway: GiveawayType) {
        if (!giveaway?.MessageID) return;
        if (this.cache.has(giveaway?.MessageID))
            return this.cache.get(giveaway?.MessageID);
        const GiveawayInstance = await new Giveaway(giveaway).load();
        if (!GiveawayInstance) return;
        this.cache.set(giveaway.MessageID, GiveawayInstance);
        return GiveawayInstance;
    }

    async autocomplete(interaction: AutocompleteInteraction, search: string) {
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

    async filterAndManager(giveaways: GiveawayType[]) {
        if (!giveaways?.length) return;

        for (const giveaway of giveaways)
            this.set(giveaway);

        return;
    }

    clearTimeout(messageID: string) {
        return clearTimeout(this.cache.get(messageID)?.timeout);
    }

    async deleteGiveawayFromDatabase(messageID: string, guildId: string) {

        if (!guildId || !messageID) return;

        this.clearTimeout(messageID);

        await Database.Guilds.updateOne(
            { id: guildId },
            { $pull: { Giveaways: { MessageID: messageID } } },
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

    async removeThisMemberFromAllGiveaways(userId: string, guildId: string) {
        const giveaways = await this.getGiveawaysFromAGuild(guildId);
        if (giveaways.length) return;
        for (const giveaway of giveaways) giveaway.removeParticipant(userId);
        return;
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

        const message = await giveaway.getMessage();
        if (!message) return;

        const components: any = message?.components?.[0]?.toJSON();

        if (!message?.id || !components)
            return this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

        if (components && components?.components[0]) {
            components.components[0].disabled = true;
            components.components[1].disabled = true;
        }

        const embed = message?.embeds[0];
        if (!embed || !components?.components[0])
            return this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);

        const field = embed.fields?.find(fild => fild?.name?.includes(e.Trash));
        if (field) field.value = t("giveaway.expired", giveaway.guild?.preferredLocale);

        this.deleteGiveawayFromDatabase(giveaway.MessageID, giveaway.GuildId);
        return await message.edit({ embeds: [embed], components: [components] });
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

    async getGiveawaysFromAGuild(guildId: string) {
        return Array.from(this.cache.values()).filter((giveaway) => giveaway.GuildId === guildId);
    }
}