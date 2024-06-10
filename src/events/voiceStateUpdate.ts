import { Events } from "discord.js";
import Database from "../database/index.js";
import { AfkManager, TempcallManager } from "../managers/index.js";
import client from "../saphire/index.js";

client.on(Events.VoiceStateUpdate, async (oldState, newState): Promise<any> => {

    if (!newState.member || !oldState.member) return;
    // Database.setCache(newState.member.user.id, newState.member.user.toJSON(), "user");
    AfkManager.delete(newState.member.id, newState.guild.id);

    if (
        !TempcallManager.guildsId.has(newState.guild.id)
        || newState.member.user.bot
    ) return;

    const inMute = newState.selfMute || newState.selfDeaf || newState.serverMute || newState.serverDeaf || false;
    if (newState.channel && !oldState.channel) return await userJoin(newState.member.id, newState.guild.id, inMute);
    if (oldState.channel && !newState.channel) return await userLeave(oldState.member.id, oldState.guild.id);

    if (!inMute) return await unmute(newState.member.id, newState.guild.id);
    if (!TempcallManager.guildsWithMuteCount.has(newState.guild.id)) return;
    if (inMute) return await muted(newState.member.id, newState.guild.id);

    return;
});

async function unmute(memberId: string, guildId: string) {
    if (!TempcallManager.inCall[guildId]) TempcallManager.inCall[guildId] = {};
    TempcallManager.inCall[guildId][memberId] = Date.now();

    if (TempcallManager.inMute[guildId][memberId]) {
        const time = TempcallManager.inMute[guildId][memberId];
        delete TempcallManager.inMute[guildId][memberId];
        await Database.Guilds.updateOne(
            { id: guildId },
            { $inc: { [`TempCall.membersMuted.${memberId}`]: Date.now() - time } },
        );
    }

    return;
}

async function muted(memberId: string, guildId: string) {
    if (!TempcallManager.inMute[guildId]) TempcallManager.inMute[guildId] = {};
    TempcallManager.inMute[guildId][memberId] = Date.now();

    if (TempcallManager.inCall[guildId][memberId]) {
        const time = TempcallManager.inCall[guildId][memberId];
        delete TempcallManager.inCall[guildId][memberId];
        await Database.Guilds.updateOne(
            { id: guildId },
            { $inc: { [`TempCall.members.${memberId}`]: Date.now() - time } },
        );
    }

    return;
}

async function userJoin(memberId: string, guildId: string, inMute: boolean) {
    if (inMute && TempcallManager.guildsWithMuteCount.has(guildId))
        return TempcallManager.inMute[guildId][memberId] = Date.now();
    return TempcallManager.inCall[guildId][memberId] = Date.now();
}

async function userLeave(memberId: string, guildId: string) {

    if (!TempcallManager.inCall[guildId]) TempcallManager.inCall[guildId] = {};
    if (!TempcallManager.inMute[guildId]) TempcallManager.inMute[guildId] = {};

    const inCallTime = TempcallManager.inCall[guildId][memberId];
    const inMuteTime = TempcallManager.inMute[guildId][memberId];
    delete TempcallManager.inCall[guildId][memberId];
    delete TempcallManager.inMute[guildId][memberId];

    const dataToSave: Record<string, number> = {};

    if (inCallTime) dataToSave[`TempCall.members.${memberId}`] = Date.now() - inCallTime;
    if (inMuteTime) dataToSave[`TempCall.membersMuted.${memberId}`] = Date.now() - inMuteTime;

    if (Object.keys(dataToSave).length)
        await Database.Guilds.findOneAndUpdate(
            { id: guildId },
            { $inc: { dataToSave } },
        );

    return;
}