import { Events } from "discord.js";
import client from "../saphire";
import { GiveawayManager } from "../managers";

client.on(Events.GuildDelete, async guild => {
    return GiveawayManager.deleteAllGiveawaysFromThisGuild(guild?.id, true);
});