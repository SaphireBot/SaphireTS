import { Events } from "discord.js";
import client from "../saphire";
import { GiveawayManager } from "../managers";

client.on(Events.GuildMemberRemove, async (member) => {
    GiveawayManager.removeThisMemberFromAllGiveaways(member.id, member.guild.id);
    return;
    // if (member.partial) await member.fetch();
});