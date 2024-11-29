import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager, GiveawayManager, JokempoManager, PayManager, TopGGManager } from "../managers";
import checkBeforeNotifyLeaveMessage from "./functions/notify.leave";
import kickLogs from "./functions/kick.logs";

client.on(Events.GuildMemberRemove, async (member) => {
  
    await JokempoManager.deleteAllGamesWithThisMemberFromThisGuild(member.guild?.id, member?.user?.id);
    await GiveawayManager.removeThisMemberFromAllGiveaways(member.id, member.guild.id);
    await AfkManager.delete(member.user.id, member.guild.id);
    await PayManager.refundByUserId(member.id);
    await TopGGManager.deleteByUserId(member.id);
    await checkBeforeNotifyLeaveMessage(member);
    await kickLogs(member);
    return;

});