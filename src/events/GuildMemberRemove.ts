import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager, GiveawayManager, JokempoManager, PayManager } from "../managers";
import { members } from "../database/cache";
import Database from "../database";

client.on(Events.GuildMemberRemove, async (member) => {
    Database.setCache(member.user.id, member.user.toJSON(), "user");
  
    for (const str of [member?.user?.id, member?.user?.globalName, member?.user?.username])
        members.delete(`${member.guild?.id}_${str}`);
   
    JokempoManager.deleteAllGamesWithThisMemberFromThisGuild(member.guild?.id, member?.user?.id);
    GiveawayManager.removeThisMemberFromAllGiveaways(member.id, member.guild.id);
    AfkManager.delete(member.user.id, member.guild.id);
    PayManager.refundByUserId(member.id);
    return;

});