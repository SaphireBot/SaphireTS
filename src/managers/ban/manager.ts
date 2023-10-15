import Database from "../../database";
import { GuildSchema } from "../../database/models/guild";
import client from "../../saphire";
import { t } from "../../translator";

export default class BanManager {
    bans = new Map<string, {
        guildId: string,
        userId: string,
        unbanAt: Date,
        timeout?: NodeJS.Timeout
    }>();
    constructor() { }

    async load(guildsData: GuildSchema[]) {
        const data = guildsData.filter(doc => doc.Bans?.length > 0);
        if (!data?.length) return;

        for (const guildData of data)
            for (const ban of guildData.Bans) {
                const timeout = setTimeout(() => this.unban(guildData.id!, ban.userId!), ban.unbanAt!.valueOf() - Date.now());
                this.bans.set(`${guildData.id}_${ban.userId}`, { userId: ban.userId!, guildId: guildData.id!, unbanAt: ban.unbanAt!, timeout });
            }

        return;
    }

    async unban(guildId: string, userId: string) {

        const ban = this.get(guildId, userId);
        if (!ban) return;

        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
            this.delete(guildId, userId);
            return this.removeAllFromThisGuild(guildId);
        }

        return await guild.bans.remove(ban.userId, t("ban.unban", guild.preferredLocale))
            .then(() => this.delete(guildId, userId))
            .catch(() => this.delete(guildId, userId));
    }

    async delete(guildId: string, userId: string) {
        const ban = this.get(guildId, userId);
        if (!ban) return;

        if (ban.timeout) clearTimeout(ban.timeout);
        await Database.Guilds.updateOne(
            { id: guildId },
            { $pull: { Bans: { userId } } }
        );
        return this.bans.delete(`${guildId}_${userId}`);
    }

    async set(guildId: string, userId: string, timeMs: number) {
        if (!timeMs || timeMs <= 0) return;
        let timeout = undefined;
        if (timeMs <= 2147483647) timeout = setTimeout(() => this.unban(guildId, userId), timeMs);
        this.bans.set(`${guildId}_${userId}`, {
            guildId,
            userId,
            unbanAt: new Date(Date.now() + timeMs),
            timeout
        });
        await Database.Guilds.updateOne(
            { id: guildId },
            {
                $addToSet: {
                    Bans: { userId, unbanAt: new Date(Date.now() + timeMs) }
                }
            }
        );
        return;
    }

    get(guildId: string, userId: string) {
        return this.bans.get(`${guildId}_${userId}`);
    }

    removeAllFromThisGuild(guildId: string) {
        for (const banKey of this.bans.keys())
            if (banKey.includes(guildId)) {
                const ban = this.bans.get(banKey);
                if (ban?.timeout) clearTimeout(ban.timeout);
                this.bans.delete(banKey);
            }
    }
}