import { Routes, APIMessage, DiscordAPIError, PermissionFlagsBits, GuildTextBasedChannel, GuildBasedChannel, Message, APIUser } from "discord.js";
import { GuildSchema } from "../../database/models/guild";
import client from "../../saphire";
import lauch from "./lauch";

export type GiveawayType = GuildSchema["Giveaways"][0] & {
    timeout?: NodeJS.Timeout
    DateNow: number
    TimeMs: number
    MessageID: string
    ChannelId: string
    GuildId: string
};

export default class Giveaway {
    declare WinnersGiveaway: string[];
    declare GiveawayParticipants: string[];
    declare Actived: boolean;
    Participants = new Set<string>();
    declare timeout: NodeJS.Timeout;
    declare retryCooldown: number;
    declare message: Message<true>;
    declare LauchDate: number;
    readonly twentyDays = 1000 * 60 * 60 * 24 * 20;
    declare readonly MessageID: string;
    declare readonly GuildId: string;
    declare readonly Prize: string;
    declare readonly Winners: number;
    declare readonly Emoji: string;
    declare readonly TimeMs: number;
    declare readonly DateNow: number;
    declare readonly ChannelId: string;
    declare readonly MessageLink: string;
    declare readonly CreatedBy: string;
    declare readonly Sponsor: string;
    declare readonly AllowedRoles: string[];
    declare readonly LockedRoles: string[];
    declare readonly AllowedMembers: string[];
    declare readonly LockedMembers: string[];
    declare readonly RequiredAllRoles: boolean;
    declare readonly AddRoles: string[];
    declare readonly MultipleJoinsRoles: { id?: string, joins?: number }[];
    declare readonly MinAccountDays: number;
    declare readonly MinInServerDays: number;

    constructor(giveaway: GiveawayType) {
        this.MessageID = giveaway.MessageID;
        this.GuildId = giveaway.GuildId;
        this.Prize = giveaway.Prize!;
        this.Winners = giveaway.Winners!;
        this.WinnersGiveaway = giveaway.WinnersGiveaway;
        this.GiveawayParticipants = giveaway.Participants;
        this.Emoji = giveaway.Emoji!;
        this.TimeMs = giveaway.TimeMs;
        this.DateNow = giveaway.DateNow;
        this.LauchDate = giveaway.LauchDate!;
        this.ChannelId = giveaway.ChannelId;
        this.Actived = giveaway.Actived!;
        this.MessageLink = giveaway.MessageLink!;
        this.CreatedBy = giveaway.CreatedBy!;
        this.Sponsor = giveaway.Sponsor!;
        this.AllowedRoles = giveaway.AllowedRoles;
        this.LockedRoles = giveaway.LockedRoles;
        this.AllowedMembers = giveaway.AllowedMembers;
        this.LockedMembers = giveaway.LockedMembers;
        this.RequiredAllRoles = giveaway.RequiredAllRoles!;
        this.AddRoles = giveaway.AddRoles;
        this.MultipleJoinsRoles = giveaway.MultipleJoinsRoles;
        this.MinAccountDays = giveaway.MinAccountDays!;
        this.MinInServerDays = giveaway.MinInServerDays!;
    }

    async load() {
        await this.loadParticipants();
        this.defineTimeout();
        return this;
    }

    async loadParticipants() {
        for await (const id of this.GiveawayParticipants)
            this.Participants.add(id);
        return true;
    }

    addParticipant(userId: string) {
        return this.Participants.add(userId);
    }

    addParticipants(usersId: string[]) {
        this.Participants = new Set(usersId);
        return this.Participants;
    }

    removeParticipant(userId: string) {
        return this.Participants.delete(userId);
    }

    *removeParticipants(usersId: string[]) {
        for (const id of usersId) {
            yield this.Participants.delete(id);
        }
    }

    userIsParticipant(userId: string) {
        return this.Participants.has(userId);
    }

    defineTimeout() {

        if (this.LauchDate)
            return this.setUnavailable();

        const timeMs = (this.DateNow + this.TimeMs) - Date.now();

        if (timeMs > 2147483647)
            return this.watchOverTimeout();

        if (this.twentyDays < timeMs)
            return this.delete();

        if (timeMs <= 1000)
            return this.start();

        this.Actived = true;
        this.timeout = setTimeout(() => this.start(), timeMs);

        return;
    }

    watchOverTimeout() {
        ((this.DateNow + this.TimeMs) - Date.now()) < 2147483647
            ? this.defineTimeout()
            : setTimeout(() => this.watchOverTimeout(), 1000 * 60 * 60);
        return;
    }

    clearTimeout() {
        if (this.timeout)
            clearTimeout(this.timeout);
    }

    refresh() {
        if (this.timeout)
            this.timeout.refresh();
    }

    retry() {
        this.retryCooldown = (this.retryCooldown || 0) + 1000;
        console.log(this.retryCooldown);
        setTimeout(() => this.start(), this.retryCooldown);
        return;
    }

    async setUnavailable() {
        const timeMs = (this.DateNow + this.TimeMs) - Date.now();
        if (timeMs <= -this.twentyDays) return this.delete(); // 20 days
        return setTimeout(() => this.delete(), this.twentyDays - (timeMs - timeMs - timeMs));
    }

    delete() {
        if (this.timeout) clearTimeout(this.timeout);
        return client.emit("deleteGiveaway", this.GuildId, this.MessageID);
    }

    get guild() {
        return client.guilds.cache.get(this.GuildId);
    }

    get channel() {
        return this.guild?.channels.cache.get(this.ChannelId) as GuildTextBasedChannel | null | undefined;
    }

    get lauched() {
        return (this.TimeMs - (Date.now() - this.DateNow)) < 0 || !this.Actived || (this.LauchDate || 0) > 0;
    }

    async fetchMessage() {
        return await client.rest.get(
            Routes.channelMessage(this.ChannelId, this.MessageID)
        ).catch(err => err) as APIMessage | DiscordAPIError;
    }

    async fetchSponsor(): Promise<APIUser | undefined | void> {
        if (!this.Sponsor) return;
        return client.users.cache.get(this.Sponsor)?.toJSON() as APIUser
            || await client.rest.get(Routes.user(this.Sponsor))
                .catch(() => undefined) as APIUser | undefined;
    }

    async getChannel() {
        return await this.guild?.channels.fetch(this.ChannelId, { force: true, cache: true }).catch(err => err) as GuildBasedChannel | null | undefined | DiscordAPIError;
    }

    async start() {
        const channel = await this.getChannel();

        if (channel instanceof DiscordAPIError) {
            if (channel.code === 50001) // Missing Access
                return this.retry();

            if (channel.code === 10003) // Unknown Channel
                return this.delete();

            return console.log(channel);
        }

        if (!channel) return this.delete();

        const clientMember = this.guild?.members.me || await this.guild?.members.fetchMe().catch(() => null);
        if (!clientMember) return;

        if (
            this.channel
                ?.permissionsFor(clientMember, true)
                .missing([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]).length
        )
            return this.retry();

        const message = await this.channel?.messages.fetch(this.MessageID);
        if (!message) return this.retry();
        this.message = message;
        return lauch(this);
    }
}