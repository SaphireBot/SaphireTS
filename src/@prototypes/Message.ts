import { Message, Routes, APIUser, User, GuildMember, APIGuildMember, Collection } from "discord.js";
import client from "../saphire";
const users = new Collection<string, User | APIUser>();
const members = new Map<string, GuildMember | APIGuildMember>();

Message.prototype.getUser = async function (query = "") {

    const filter = (u: any) => u?.id === query || u?.username === query || u?.globalName === query || u?.global_name === query;
    const userCache = users.find(filter);
    if (userCache) return userCache;

    let user;

    if (query)
        user = client.users.cache.find(filter)
            || this.mentions.members?.get(query)?.user
            || await client.users.fetch(query).catch(() => null)
            || await this.guild?.members.fetch({ query, limit: 100 })
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
        users.set(query, user);
        setTimeout(() => users.delete(query), 1000 * 60 * 5);
        return user;
    }
    const data = await client.rest.get(Routes.user(query)).catch(() => null) as APIUser;

    if (data?.id) {
        users.set(query, data);
        setTimeout(() => users.delete(query), 1000 * 60 * 5);
        return data;
    }

    return this.mentions?.members?.first()?.user || this.author;
};

Message.prototype.getMember = async function (query = "") {

    if (members.has(`${this.guildId}_${query}`))
        return members.get(`${this.guildId}_${query}`);

    if (query) {
        const member = this.mentions.members?.get(query)
            || this.guild?.members.cache.get(query)
            || await this.guild?.members.fetch(query).catch(() => undefined)
            || await this.guild?.members.fetch({ query: query }).then(m => m.first()).catch(() => { });

        if (member) {
            members.set(`${this.guildId}_${query}`, member);
            setTimeout(() => members.delete(`${this.guildId}_${query}`), 1000 * 60 * 5);
            return member;
        }

        return;
    }

    return this.mentions.members?.first() || this.member;
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
                .concat((this.content.trim().split(/ /g).slice(1) || []))
        )
    );
};