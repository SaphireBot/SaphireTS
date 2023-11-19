import { Message, MessageType } from "discord.js";
import Database from "../../database";
import client from "../../saphire";
import { e } from "../../util/json";
import { t } from "../../translator";
interface AfkData {
    userId: string
    guildId: string
    message: string
    type: "guild" | "global"
    deleteAt: Date
    timeout?: NodeJS.Timeout
}

export default class AfkManager {
    guilds = new Map<string, AfkData>();
    warned = new Set<string>();

    constructor() { }

    async load(guildsId: string[]) {

        const query = client.shardId === 0
            ? { guildId: { $in: guildsId }, type: "global" }
            : { guildId: { $in: guildsId }, type: "guild" };

        const documents = await Database.Afk.find(query);
        const documentsIdToDeleted = new Set<string>();

        for await (const doc of documents) {

            const data = doc.toObject() as AfkData;

            if (data.deleteAt! < new Date()) {
                documentsIdToDeleted.add(data.userId);
                continue;
            }

            setTimeout(() => this.delete(data.userId, data.guildId), data.deleteAt!.valueOf() - Date.now());

            if (doc.type === "guild")
                this.guilds.set(`${doc.userId}.${doc.guildId}`, data);

            if (doc.type === "global")
                if ((await Database.Redis.json.type(`AFK_GLOBAL_${data.userId}`)) === null)
                    Database.setCache(`AFK_GLOBAL_${data.userId}`, data, "cache", (doc.deleteAt!.valueOf() - Date.now()) / 1000);
        }

    }

    async delete(userId: string, guildId: string) {
        await Database.Redis.json.del(`AFK_GLOBAL_${userId}`, "$");
        await Database.Afk.deleteMany({ userId });
        this.guilds.delete(`${userId}.${guildId}`);
        this.warned.delete(`${userId}.${guildId}`);
        return;
    }

    async set(userId: string, message: string, guildId: string, type: "guild" | "global"): Promise<boolean> {

        for (const state of [userId, message, guildId, type])
            if (typeof state !== "string") return false;

        const data = await Database.Afk.findOneAndUpdate(
            { userId },
            {
                $set: {
                    guildId,
                    type,
                    message,
                    deleteAt: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)),

                }
            },
            { new: true, upsert: true }
        ).catch(() => null);
        if (!data) return false;

        await Database.Redis.json.set(`AFK_GLOBAL_${userId}`, "$", data.toObject());
        Database.setCache(`AFK_GLOBAL_${data.userId}`, data, "cache", 604800); // 604.800 - 1 Week;

        if (guildId) this.guilds.set(`${data.userId}.${data.guildId}`, data.toObject());
        return true;
    }

    async check(message: Message) {

        const { author, member, type, guild, userLocale: locale } = message;

        if (
            !message
            || !member
            || !message?.id
            || !guild?.id
            || ![MessageType.Default, MessageType.Reply].includes(type)
            || message.author.bot
        ) return;

        if (
            this.guilds.has(`${author.id}.${guild.id}`)
            || (await Database.Redis.json.type(author.id)) === null
        ) {
            member.setNickname(member.displayName.replace(/\[AFK\]/g, ""), "AFK Command Disable").catch(() => { });
            return this.delete(author.id, guild.id);
        }

        const mentions = message.mentions.members;
        if (!mentions?.size) return;
        let content = "";

        for await (const [memberId, member] of mentions) {
            if (this.warned.has(memberId)) continue;

            const globalData = (await Database.Redis.json.get(`AFK_GLOBAL_${memberId}`) as any) as AfkData;
            if (globalData) {
                this.warned.add(`${memberId}.${guild.id}`);
                setTimeout(() => this.warned.delete(`${memberId}.${guild.id}`), 1000 * 60);
                content += t("afk.is_globally_offline", {
                    e,
                    locale,
                    member,
                    message: globalData.message ? `\n📝 | ${globalData.message}` : ""
                });
            }

            const serverData = this.guilds.get(`${author.id}.${guild.id}`);
            if (serverData) {
                this.warned.add(memberId);
                setTimeout(() => this.warned.delete(memberId), 1000 * 60 * 2);
                content += t("afk.is_guild_offline", {
                    e,
                    locale,
                    member,
                    message: serverData.message ? `\n📝 | ${serverData.message}` : ""
                });
            }

            if ((globalData || serverData) && !member?.displayName?.includes("[AFK]"))
                member.setNickname(`${member.displayName} [AFK]`, t("afk.system_enable", guild.preferredLocale || "en-US")).catch(() => { });

            if (!globalData && !serverData && member?.displayName?.includes("[AFK]"))
                member.setNickname(member.displayName.replace("[AFK]", ""), t("afk.system_disable", guild.preferredLocale || "en-US")).catch(() => { });

            continue;
        }

        if (content.length > 0)
            return await message.reply({ content: content.limit("MessageContent") }).then(pushDelete).catch(() => null);

        function pushDelete(msg: Message) {
            return setTimeout(() => msg.delete(), 1000 * 7);
        }
        return;
    }
}