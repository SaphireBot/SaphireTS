import { Events } from "discord.js";
import client from "../saphire";
import { bans } from "../structures/interaction/autocomplete/unban";

client.on(Events.GuildBanAdd, async (ban) => {
    const data = bans.get(ban.guild.id);
    if (data) {
        data.push({ reason: ban.reason || null, user: ban.user });
        bans.set(ban.guild.id, data);
        return;
    }

    bans.set(ban.guild.id, [{ reason: ban.reason || null, user: ban.user }]);
    return;
});