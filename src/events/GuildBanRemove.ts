import { Events } from "discord.js";
import { BanManager } from "../managers";
import client from "../saphire";

client.on(Events.GuildBanRemove, async (ban) => {
    await BanManager.delete(ban.guild?.id, ban.user?.id);
    return;
});