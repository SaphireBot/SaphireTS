import { Message, GuildMember, User } from "discord.js";
import client from "../saphire";
import { members, users } from "../database/cache";
const guildsFetched = new Set<string>();

function filter(target: GuildMember | User | undefined | null, query?: any) {
    if (!target || !query) return false;

    if (
        target?.id === query
        || `<@${target?.id}>` === query
    ) return true;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const t = (query as string)
        ?.toLowerCase()
        ?.compare(
            [
                // member
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.displayName?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.user?.globalName?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.user?.username?.toLowerCase(),

                // user
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.global_name?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.globalName?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.username?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.tag?.toLowerCase()
            ]
                .filter(Boolean) as string[]
        );

    return t ? true : false;
}

function isId(id: string) {
    return /^\d{17,}$/g.test(id);
}

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
            || await client.users.fetch(query).catch(() => undefined);

    if (user) {
        users.set(user.id, user);
        setTimeout(() => users.delete(user!.id), 1000 * 60 * 5);
        return user;
    }

    return this.mentions?.users?.find(t => filter(t, query));
};

Message.prototype.getMember = async function (query?: string | string[]) {
    query = typeof query === "string" ? query?.toLowerCase() : this.formatQueries();

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

    if (isId(query)) {
        member = await this.guild?.members.fetch(query);
        if (member) return member;
    }

    if (typeof query === "string")
        member = this.mentions.members?.find(t => filter(t, query))
            || this.guild?.members.cache.find(t => filter(t, query));

    if (member?.id) {
        if (!members.has(`${this.guildId}_${member.id}`)) {
            members.set(`${this.guildId}_${member.id}`, member);
            setTimeout(() => members.delete(`${this.guildId}_${member?.id}`), 1000 * 60 * 5);
        }
        return member;
    }

    return this.mentions?.members?.find(t => filter(t, query));
};

Message.prototype.getMultipleUsers = async function () {

    if (!guildsFetched.has(this.guildId!)) {
        await this.guild?.members.fetch().catch(() => null);
        guildsFetched.add(this.guildId!);
        setTimeout(() => guildsFetched.delete(this.guildId!), 1000 * 60 * 5);
    }

    const queries = this.formatQueries();
    if (queries?.length)
        return (await Promise.all(queries.filter(Boolean).map(query => this.getUser(query)))).filter(Boolean);

    return this.mentions.users?.toJSON() || [];
};

Message.prototype.getMultipleMembers = async function () {

    if (!guildsFetched.has(this.guildId!)) {
        await this.guild?.members.fetch().catch(() => null);
        guildsFetched.add(this.guildId!);
        setTimeout(() => guildsFetched.delete(this.guildId!), 1000 * 60 * 5);
    }

    const queries = this.formatQueries()?.filter(Boolean);
    if (queries?.length) {
        return (await Promise.all(queries.map(query => this.getMember(query)))).filter(Boolean);
    }

    return this.mentions.members?.toJSON() || [];
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
        )
    )
        .filter(Boolean);
};