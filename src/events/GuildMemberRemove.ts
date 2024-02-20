import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager, GiveawayManager, JokempoManager, PayManager, TopGGManager } from "../managers";
import Database from "../database";

client.on(Events.GuildMemberRemove, async (member) => {
    Database.setCache(member.user.id, member.user.toJSON(), "user");
  
    JokempoManager.deleteAllGamesWithThisMemberFromThisGuild(member.guild?.id, member?.user?.id);
    GiveawayManager.removeThisMemberFromAllGiveaways(member.id, member.guild.id);
    AfkManager.delete(member.user.id, member.guild.id);
    PayManager.refundByUserId(member.id);
    TopGGManager.deleteByUserId(member.id);
    return;

});