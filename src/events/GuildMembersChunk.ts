import { Events } from "discord.js";
import client from "../saphire";
import { members } from "../database/cache";

client.on(Events.GuildMembersChunk, async (membersChunck, guild, _) => {
    for (const member of membersChunck.values()) {
        if (!members.has(`${guild.id}_${member.id}`))
            members.set(`${guild.id}_${member.id}`, member);
    }
});