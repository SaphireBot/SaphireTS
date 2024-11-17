import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager, GiveawayManager, JokempoManager, PayManager, TopGGManager } from "../managers";
import checkBeforeNotifyLeaveMessage from "./functions/notify.leave";
// import Database from "../database";

client.on(Events.GuildMemberRemove, async (member) => {
    // Database.setCache(member.user.id, member.user.toJSON(), "user");
  
    await JokempoManager.deleteAllGamesWithThisMemberFromThisGuild(member.guild?.id, member?.user?.id);
    await GiveawayManager.removeThisMemberFromAllGiveaways(member.id, member.guild.id);
    await AfkManager.delete(member.user.id, member.guild.id);
    await PayManager.refundByUserId(member.id);
    await TopGGManager.deleteByUserId(member.id);
    await checkBeforeNotifyLeaveMessage(member);
    return;

});