import { Guild, GuildMember, PermissionFlagsBits } from "discord.js";
import Database from "../../database";
import { GuildSchema } from "../../database/models/guild";
import client from "../../saphire";
export const moderationPermissions = [
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.MuteMembers,
    PermissionFlagsBits.DeafenMembers,
    PermissionFlagsBits.MoveMembers,
    PermissionFlagsBits.ManageNicknames,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ModerateMembers
];

export default class AutoroleManager {
    declare cache: Map<string, Set<string>>;

    constructor() {
        this.cache = new Map();
    }

    load(guildsData: GuildSchema[]) {
        for (const data of guildsData)
            if (data.Autorole?.length > 0)
                this.cache.set(data.id!, new Set(data.Autorole));

        this.checker();
        return;
    }

    checker(): NodeJS.Timeout {
        if (this.cache.size)
            for (const guildId of this.cache.keys())
                this.check(guildId);

        return setTimeout(() => this.checker(), 1000 * 60);
    }

    async check(guildId: string) {
        if (!guildId) return;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return this.delete(guildId);

        const roles = Array.from(this.get(guildId) || []);
        if (!roles?.length) return this.delete(guildId);

        const missing = roles.filter(roleId => !guild.roles.cache.has(roleId));

        if (missing.length) {
            const data = await Database.Guilds.findOneAndUpdate(
                { id: guildId },
                { $pullAll: { Autorole: missing } },
                { new: true, upsert: true }
            );
            await this.refresh(guildId, data);
        }

        return;
    }

    delete(guildId: string) {
        return this.cache.delete(guildId);
    }

    get(guildId: string) {
        return Array.from(this.cache.get(guildId) || []);
    }

    getGuild(guildId: string) {
        return client.guilds.cache.get(guildId);
    }

    async removeFromDatabase(guildId: string, roleId: string) {
        await Database.Guilds.updateOne(
            { id: guildId },
            { $pull: { Autorole: roleId } }
        );
    }

    async refresh(guildId: string, data?: GuildSchema) {
        const rolesId = data
            ? Array.from(new Set(data.Autorole))
            : Array.from(new Set((await Database.getGuild(guildId))?.Autorole || []));

        return this.cache.set(guildId, new Set(Array.from(rolesId)));
    }

    roles(guild: Guild, rolesId: string[]) {
        return guild.roles.cache.clone().filter(r => rolesId.includes(r.id));
    }

    async bulkDelete(guildId: string, rolesId: string[]) {
        return await Database.Guilds.findOneAndUpdate(
            { id: guildId },
            { $pullAll: rolesId },
            { new: true, upsert: true }
        ).then(doc => this.refresh(guildId, doc?.toObject()));

    }

    async addRoles(guild: Guild, member: GuildMember) {
        const rolesId = this.get(guild.id);
        if (!rolesId?.length) return;

        const roles = this.roles(guild, rolesId);
        if (!roles.size) return this.delete(guild.id);

        const unavailableRoles = roles.filter(r => r.permissions.any(moderationPermissions, true));
        if (unavailableRoles?.size) {
            this.bulkDelete(guild.id, Array.from(unavailableRoles.keys()));
            roles.sweep((_, k) => unavailableRoles.has(k));
        }

        return await member.roles.add(Array.from(roles.keys()))
            .catch(err => {
                console.log(err);
                return;
            });
    }

    async save(guild: Guild, rolesId: string[]) {
        const data = await Database.Guilds.findOneAndUpdate(
            { id: guild.id },
            { $set: { Autorole: rolesId } },
            { new: true, upsert: true }
        );

        return await this.refresh(guild.id, data);
    }
}