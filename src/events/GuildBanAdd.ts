import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager, PayManager, JokempoManager, ReminderManager, PearlsManager } from "../managers";
import banLogs from "./functions/ban.logs";

client.on(Events.GuildBanAdd, async (ban) => {
    // Database.setCache(ban.user.id, ban.user.toJSON(), "user");
    await AfkManager.delete(ban.user.id, ban.guild.id);
    await PayManager.refundByUserId(ban.user.id);
    await JokempoManager.deleteAllGamesWithThisMemberFromThisGuild(ban.guild.id, ban.user.id);
    await ReminderManager.theUserLeaveFromThisGuild(ban.guild.id, ban.user.id);
    await PearlsManager.theUserLeaveFromThisGuild(ban.guild.id, ban.user.id);
    await banLogs(ban);

});