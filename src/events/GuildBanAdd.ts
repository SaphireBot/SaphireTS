import { Events } from "discord.js";
import client from "../saphire";
import { bans } from "../structures/interaction/autocomplete/unban";
import { AfkManager } from "../managers";
import Database from "../database";

client.on(Events.GuildBanAdd, async (ban) => {
    Database.setCache(ban.user.id, ban.user.toJSON(), "user");

    const data = bans.get(ban.guild.id);
    if (data) {
        data.push({ reason: ban.reason || null, user: ban.user });
        bans.set(ban.guild.id, data);
        return;
    }

    AfkManager.delete(ban.user.id, ban.guild.id);
    bans.set(ban.guild.id, [{ reason: ban.reason || null, user: ban.user }]);
    return;
});