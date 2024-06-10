import { Events } from "discord.js";
import { BanManager } from "../managers";
import client from "../saphire";
import Database from "../database";

client.on(Events.GuildBanRemove, async (ban) => {
    // Database.setCache(ban.user.id, ban.user.toJSON(), "user");
    await BanManager.delete(ban.guild?.id, ban.user?.id);
    return;
});