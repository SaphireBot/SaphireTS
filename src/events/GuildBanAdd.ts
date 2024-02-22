import { Events } from "discord.js";
import client from "../saphire";
import { AfkManager } from "../managers";
import Database from "../database";

client.on(Events.GuildBanAdd, async (ban) => {
    Database.setCache(ban.user.id, ban.user.toJSON(), "user");
    AfkManager.delete(ban.user.id, ban.guild.id);
    // ban.guild.bans.cache.set(ban.user.id, ban);
    return;
});