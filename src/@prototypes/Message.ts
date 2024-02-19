import { Message, GuildMember, User, LocaleString } from "discord.js";
import client from "../saphire";
import { members, users, filter } from "../database/cache";
import Database from "../database";
import { locales } from "./User";
import { Config } from "../util/constants";

Message.prototype.locale = async function (): Promise<any> {
    const locale = locales.get(this.author?.id);
    if (locale) return locale;

    const data = (await Database.getUser(this.author?.id))?.locale as LocaleString | undefined;

    if (typeof data === "string" && Config.locales.includes(data)) {
        locales.set(this.id, data);
        setTimeout(() => locales.delete(this.author?.id), 1000 * 60 * 10);
        return data;
    }

    if (Config.locales.includes(this.guild?.preferredLocale as string))
        return data;

    return data || "en-US";
};

Message.prototype.getUser = async function (query?: string | string[] | undefined | null) {

    query = typeof query === "string" ? query?.toLowerCase() : this.formatQueries();

    if (Array.isArray(query)) {
        for await (const q of query) {
            const user = await this.getUser(q);
            if (user) return user;
            else continue;
        }
        return;
    }

    if (!query)
        return this.mentions?.users?.first() || this.author;

    const userCache = users.find(t => filter(t, query));
    if (userCache) return userCache;

    let user: User | undefined;

    if (query)
        user = client.users.cache.find(t => filter(t, query))
            || this.mentions?.users?.find(t => filter(t, query))
            || this.guild?.members?.cache.find(t => filter(t, query))?.user
            || await client.users.fetch(query).catch(() => undefined)
            || (await Database.UserCache.json.get(query) as any) as User | undefined;

    if (user) {
        users.set(user.id, user);
        Database.setCache(query, user, "user");
        setTimeout(() => users.delete(user!.id), 1000 * 60 * 5);
        return user;
    }

    return this.mentions?.users?.find(t => filter(t, query));
};

Message.prototype.getMember = async function (query?: string | string[]) {
    query = typeof query === "string" ? query?.toLowerCase() : this.formatQueries();

    if (members.has(`${this.guildId}_${query}`))
        return members.get(`${this.guildId}_${query}`);

    if (Array.isArray(query)) {
        for await (const q of query) {
            const member = await this.getMember(q);
            if (member) return member;
            continue;
        }
        return;
    }

    const memberCache = members.find(t => filter(t, query));
    if (memberCache) return memberCache;

    let member: GuildMember | null | undefined;

    if (query.isDiscordId()) {
        member = await this.guild?.members.fetch(query).catch(() => null);
        if (member) return member;
    }

    if (typeof query === "string")
        member = this.mentions.members?.find(t => filter(t, query))
            || this.guild?.members.cache.find(t => filter(t, query));

    if (!member && this.reference?.messageId) {
        const message = await this.channel.messages.fetch(this.reference?.messageId).catch(() => null);
        if (message) member = message.member;
    }

    if (member?.id) {
        if (!members.has(`${this.guildId}_${member.id}`)) {
            members.set(`${this.guildId}_${member.id}`, member);
            setTimeout(() => members.delete(`${this.guildId}_${member?.id}`), 1000 * 60 * 5);
        }
        return member;
    }

    return this.mentions?.members?.find(t => filter(t, this.content));
};

Message.prototype.formatQueries = function () {
    return Array.from(
        new Set<string>(
            [
                this.content.trim().split(/ /g).slice(1) || [],
                this.mentions.repliedUser?.id || "",
                Array.from(this.mentions?.users?.keys() || []),
                Array.from(this.mentions?.members?.keys() || [])
            ]
                .flat()
                .filter(Boolean)
                .join(" ")
                .match(/[\w\d]+/g)
                ?.map(str => str?.toLowerCase())
        )
    )
        .filter(Boolean);
};
