import { Events } from "discord.js";
import client from "../saphire";
import { GiveawayManager, JokempoManager } from "../managers";
import { members } from "../database/cache";

client.on(Events.GuildDelete, async guild => {

    for (const key of members.keys())
        if (key.includes(guild?.id))
            members.delete(key);

    GiveawayManager.deleteAllGiveawaysFromThisGuild(guild?.id, true);
    JokempoManager.deleteAllFromThisGuild(guild?.id);
    return;
});