import { Message, Routes, APIUser, GuildMember, User } from "discord.js";
import client from "../saphire";
import { members, users } from "../database/cache";

Message.prototype.getUser = async function (query?: any) {
    query = query || this.formatQueries();

    if (Array.isArray(query))
        query = query[0];

    const filter = (u: any) => {
        const t = (query as string)
            ?.toLowerCase()
            ?.compare(
                [
                    // Member
                    u?.displayName?.toLowerCase(),
                    u?.user?.globalName?.toLowerCase(),
                    u?.user?.username?.toLowerCase(),
                    // User
                    u?.globalName?.toLowerCase(),
                    u?.global_name?.toLowerCase(),
                    u?.username?.toLowerCase(),
                    u?.id
                ].filter(Boolean) as string[]);
        return t ? true : false;
    };

    if (typeof query !== "string") return this.mentions?.users?.find(filter);

    const userCache = users.find(filter);
    if (userCache) return userCache;

    let user: User | APIUser | undefined;

    if (!query)
        return this.mentions?.users?.find(filter);

    if (query)
        user = client.users.cache.find(filter)
            || this.mentions.members?.find(filter)?.user
            || this.guild?.members.cache.find(filter)?.user
            || await client.users.fetch(query).catch(() => null)
            || await this.guild?.members.fetch({ query, limit: 100, time: 2000 })
                .then(m => {
                    const members = m.toJSON();
                    let u: any;

                    for (const data of members) {
                        if (!users.has(data?.id)) {
                            users.set(data.id, data?.user);
                            setTimeout(() => users.delete(data.id), 1000 * 60 * 5);
                        }
                        if (filter(data?.user))
                            u = data?.user;
                    }

                    return u;
                })
                .catch(() => null);

    if (user) {
        users.set(user.id, user);
        setTimeout(() => users.delete(query!), 1000 * 60 * 5);
        return user;
    }

    if (/^\d{17,}$/g.test(query)) {
        const data = await client.rest.get(Routes.user(query)).catch(() => null) as APIUser;

        if (data?.id) {
            if (!users.has(data.id)) {
                users.set(data.id, data);
                setTimeout(() => users.delete(query!), 1000 * 60 * 5);
            }
            return data;
        }
    }

    return this.mentions?.users?.find(filter);
};

Message.prototype.getMember = async function (query?: string | string[]) {
    query = typeof query === "string" ? query?.toLowerCase() : this.formatQueries();

    if (Array.isArray(query)) {
        for await (const q of query) {
            const member = await this.getMember(q);
            if (member) return member;
            else continue;
        }
        return;
    }

    const filter = (m: GuildMember) => {
        const t = (query as string)
            ?.toLowerCase()
            ?.compare(
                [
                    m?.displayName?.toLowerCase(),
                    m?.user?.globalName?.toLowerCase(),
                    m?.user?.username?.toLowerCase(),
                    m?.id
                ]
                    .filter(Boolean) as string[]);
        return t ? true : false;
    };

    const memberCache = members.find(filter);
    if (memberCache) return memberCache;

    let member: GuildMember | null | undefined;

    if (typeof query === "string")
        member = this.mentions.members?.find(filter)
            || this.guild?.members.cache.find(filter)
            || await this.guild?.members.fetch({ query, limit: 100, time: 2000 })
                .then(membersDataResponse => {
                    const membersData = membersDataResponse.toJSON();
                    let m: GuildMember | undefined;

                    for (const data of membersData) {
                        if (!members.has(data?.id)) {
                            members.set(`${this.guildId}_${data.id}`, data);
                            setTimeout(() => members.delete(`${this.guildId}_${data.id}`), 1000 * 60 * 5);
                        }
                        if (filter(data))
                            m = data;
                    }

                    return m;
                })
                .catch(() => null);

    if (member?.id) {
        if (!members.has(`${this.guildId}_${member.id}`)) {
            members.set(`${this.guildId}_${member.id}`, member);
            setTimeout(() => members.delete(`${this.guildId}_${member?.id}`), 1000 * 60 * 5);
        }
        return member;
    }

    return this.mentions?.members?.find(filter);
};

Message.prototype.getMultipleUsers = async function () {
    const querys = this.formatQueries();

    if (querys?.length) {
        const users = await Promise.all(querys.map(query => this.getUser(query)));
        const availableUsers = [];
        const ids = new Set();

        for (const user of users) {
            if (!user || ids.has(user?.id)) continue;
            ids.add(user.id);
            availableUsers.push(user);
        }

        return availableUsers;
    }

    return this.mentions.members?.map(member => member.user) || [];
};

Message.prototype.getMultipleMembers = async function () {
    const ids = this.formatQueries();

    if (ids?.length)
        return (await Promise.all(ids.map(id => this.getMember(id)))).filter(Boolean);

    return this.mentions.members?.toJSON() || [];
};

Message.prototype.formatQueries = function () {
    return Array.from(
        new Set<string>(
            Array.from(this.mentions.members?.keys() || [])
                .concat(...[(this.content.trim().split(/ /g).slice(1) || []), this.mentions.repliedUser?.id || ""].flat())
                .join(" ")
                .match(/\d{17,}/g)
        )
    )
        .filter(Boolean);
};