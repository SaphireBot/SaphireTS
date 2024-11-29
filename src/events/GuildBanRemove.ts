import { Events } from "discord.js";
import { BanManager } from "../managers";
import client from "../saphire";
import unbanLogs from "./functions/unban.logs";

client.on(Events.GuildBanRemove, async (unban) => {
    await BanManager.delete(unban.guild?.id, unban.user?.id);
    await unbanLogs(unban);
    return;
});