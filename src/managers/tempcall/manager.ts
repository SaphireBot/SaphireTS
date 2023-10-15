import { ChannelType, Collection, GuildMember } from "discord.js";
import client from "../../saphire";
import Database from "../../database";
import { GuildSchema } from "../../database/models/guild";


/**
 * Crédito aos que ajudaram a fazer este comando
 * Código Fonte: Rody#1000 (451619591320371213)
 * Acharam que eu não conseguiria fazer isso: ! ζ͜͡André#1495 (648389538703736833) & Nix X#1000 (807032718935326752)
 * Testers: ! ζ͜͡André#1495 (648389538703736833) & Leozinn#4649 (351144573415718914)
 */
export default class TempCallManager {
    guildsId = new Set<string>();
    guildsWithMuteCount = new Set<string>();
    inCall: Record<string, Record<string, number>> = {};
    inMute: Record<string, Record<string, number>> = {};
    constructor() {
    }

    async load(guildsData: GuildSchema[]) {

        const guildCallsEnabled = guildsData.filter(gData => gData?.TempCall?.enable);
        if (guildCallsEnabled?.length) this.guildsId = new Set(guildCallsEnabled.map(g => g.id!));
        if (guildCallsEnabled?.length) this.guildsWithMuteCount = new Set(guildCallsEnabled.filter(g => g.TempCall?.muteTime).map(g => g.id!));
        this.saveTime();

        if (this.guildsId?.size)
            for await (const guildId of this.guildsId) {
                const guild = await client.guilds.fetch(guildId).catch(() => null);
                if (!guild) {
                    this.removeGuild(guildId);
                    continue;
                }

                if (!this.inCall[guildId]) this.inCall[guildId] = {};
                if (!this.inMute[guildId]) this.inMute[guildId] = {};

                const channels = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildVoice && channel.members?.size);

                for (const channel of channels.values()) {
                    for (const member of (channel.members as Collection<string, GuildMember>).values())
                        if (!member.user.bot) {
                            this.guildsWithMuteCount.has(guildId)
                                && (member.voice.selfMute
                                    || member.voice.selfDeaf
                                    || member.voice.serverMute
                                    || member.voice.serverDeaf)
                                ? this.inMute[guildId][member.user.id] = Date.now()
                                : this.inCall[guildId][member.user.id] = Date.now();
                        }
                }

                continue;
            }

        return;
    }

    removeGuild(guildId: string) {
        this.guildsId.delete(guildId);
        this.guildsWithMuteCount.delete(guildId);
        delete this.inCall[guildId];
        delete this.inMute[guildId];
        return;
    }

    async saveTime(): Promise<any> {
        if (!this.guildsId.size) return setTimeout(() => this.saveTime(), 1000 * 15);

        const guildsId = Array.from(
            new Set([
                ...Object.keys(this.inCall || {}),
                ...Object.keys(this.inMute || {})
            ])
        );

        for await (const guildId of guildsId) {
            const inCall = Object.entries(this.inCall[guildId] || {});
            const inMute = Object.entries(this.inMute[guildId] || {});
            const toCheckState: string[] = [];
            const dataToSave = [];

            for await (const [memberId, time] of inCall) {
                if (this.inMute[guildId][memberId]) {
                    if (!toCheckState.includes(memberId)) toCheckState.push(memberId);
                    continue;
                }
                dataToSave.push([`TempCall.members.${memberId}`, Date.now() - time]);
                this.inCall[guildId][memberId] = Date.now();
                continue;
            }

            for await (const [memberId, time] of inMute) {
                if (this.inCall[guildId][memberId]) {
                    if (!toCheckState.includes(memberId)) toCheckState.push(memberId);
                    continue;
                }
                dataToSave.push([`TempCall.membersMuted.${memberId}`, Date.now() - time]);
                this.inMute[guildId][memberId] = Date.now();
                continue;
            }

            if (toCheckState.length) {
                const guild = await client.guilds.fetch(guildId).catch(() => null);
                if (guild) {

                    guild.channels.cache
                        .filter(channel => channel.type === ChannelType.GuildVoice && channel.members?.size)
                        .forEach(channel => (channel.members as Collection<string, GuildMember>)
                            .forEach(member => {
                                if (!member.user.bot && toCheckState.includes(member.id)) {
                                    dataToSave.push([`TempCall.membersMuted.${member.id}`, Date.now() - this.inMute[guildId][member.id]]);
                                    dataToSave.push([`TempCall.members.${member.id}`, Date.now() - this.inCall[guildId][member.id]]);
                                    member.voice.selfMute
                                        || member.voice.selfDeaf
                                        || member.voice.serverMute
                                        || member.voice.serverDeaf
                                        ? (() => {
                                            this.inMute[guildId][member.id] = Date.now();
                                            delete this.inCall[guildId][member.id];
                                        })()
                                        : (() => {
                                            this.inCall[guildId][member.id] = Date.now();
                                            delete this.inMute[guildId][member.id];
                                        })();
                                }
                            }));

                }
            }

            if (dataToSave.length)
                await Database.Guilds.updateOne(
                    { id: guildId },
                    { $inc: Object.fromEntries(dataToSave) }
                );
        }

        return setTimeout(() => this.saveTime(), 1000 * 15);
    }

}