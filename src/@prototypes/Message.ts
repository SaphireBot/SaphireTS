import { Message, Routes, APIUser, User, GuildMember, APIGuildMember } from "discord.js";
import client from "../saphire";
const users = new Map<string, User | APIUser>();
const members = new Map<string, GuildMember | APIGuildMember>();

Message.prototype.getUser = async function (id = "") {

    if (users.has(id))
        return users.get(id);

    let user;

    if (id && /^\d{17,}$/.test(id))
        user = this.mentions.members?.get(id)?.user
            || client.users.cache.get(id)
            || await client.users.fetch(id).catch(() => null);

    if (user) {
        users.set(id, user);
        setTimeout(() => users.delete(id), 1000 * 60 * 5);
        return user;
    }
    const data = await client.rest.get(Routes.user(id)).catch(() => null) as APIUser;

    if (data?.id) {
        users.set(id, data);
        setTimeout(() => users.delete(id), 1000 * 60 * 5);
        return data;
    }

    return this.mentions?.members?.first()?.user || this.author;
};

Message.prototype.getMember = async function (id = "") {

    if (members.has(`${this.guildId}_${id}`))
        return members.get(`${this.guildId}_${id}`);

    if (id && /^\w+$/.test(id)) {
        const member = this.mentions.members?.get(id)
            || this.guild?.members.cache.get(id)
            || await this.guild?.members.fetch(id).catch(() => undefined);

        if (member) {
            members.set(`${this.guildId}_${id}`, member);
            setTimeout(() => members.delete(`${this.guildId}_${id}`), 1000 * 60 * 5);
            return member;
        }

        return;
    }

    return this.mentions.members?.first() || this.member;
};

Message.prototype.getMultipleUsers = async function () {
    const ids = this.formatIds();

    if (ids?.length) {
        const validIds = ids.filter(i => /^\d{17,}$/.test(i));
        if (validIds?.length)
            return (await Promise.all(validIds.map(id => this.getUser(id)))).filter(Boolean);
    }

    return this.mentions.members?.map(member => member.user) || [];
};

Message.prototype.getMultipleMembers = async function () {
    const ids = this.formatIds();

    if (ids?.length) {
        const validIds = ids.filter(i => /^\d{17,}$/.test(i));
        if (validIds?.length)
            return (await Promise.all(validIds.map(id => this.getMember(id)))).filter(Boolean);
    }

    return this.mentions.members?.toJSON() || [];
};

Message.prototype.formatIds = function () {
    return Array.from(
        new Set<string>(
            Array.from(this.mentions.members?.keys() || [])
                .concat((this.content.match(/\d{17,}/g) || []))
        )
    );
};
