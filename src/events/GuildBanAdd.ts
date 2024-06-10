import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager, PayManager, JokempoManager, ReminderManager, PearlsManager } from "../managers";
import Database from "../database";

client.on(Events.GuildBanAdd, async (ban) => {
    // Database.setCache(ban.user.id, ban.user.toJSON(), "user");
    AfkManager.delete(ban.user.id, ban.guild.id);
    PayManager.refundByUserId(ban.user.id);
    JokempoManager.deleteAllGamesWithThisMemberFromThisGuild(ban.guild.id, ban.user.id);
    ReminderManager.theUserLeaveFromThisGuild(ban.guild.id, ban.user.id);
    PearlsManager.theUserLeaveFromThisGuild(ban.guild.id, ban.user.id);
});