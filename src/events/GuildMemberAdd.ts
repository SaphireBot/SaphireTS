import { Events } from "discord.js";
import client from "../saphire";
import { members } from "../database/cache";
import { BanManager } from "../managers";

client.on(Events.GuildMemberAdd, async (member) => {
    if (!member?.id) return;
    await BanManager.delete(member.guild?.id, member?.id);

    if (member.partial)
        member = await member.fetch();

    if (members.has(`${member.guild?.id}_${member.id}`)) {
        members.set(`${member.guild?.id}_${member.id}`, member);
    } else {
        members.set(`${member.guild?.id}_${member.id}`, member);
        setTimeout(() => members.delete(`${member.guild?.id}_${member.id}`), 1000 * 60 * 5);
    }
    return;
    // if (member.partial) await member.fetch();
});

client.on(Events.GuildMemberAvailable, async (member) => {
    if (!member?.id) return;
    await BanManager.delete(member.guild?.id, member?.id);

    if (member.partial)
        member = await member.fetch();

    if (members.has(`${member.guild?.id}_${member.id}`)) {
        members.set(`${member.guild?.id}_${member.id}`, member);
    } else {
        members.set(`${member.guild?.id}_${member.id}`, member);
        setTimeout(() => members.delete(`${member.guild?.id}_${member.id}`), 1000 * 60 * 5);
    }
    return;
    // if (member.partial) await member.fetch();
});