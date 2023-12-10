import Database from "../../database";
import {
    AfkManager,
    AutoroleManager,
    BanManager,
    GiveawayManager,
    JokempoManager,
    PayManager,
    RankingManager,
    ReminderManager,
    TempcallManager,
    TopGGManager
} from "../../managers";
import client from "../../saphire";
import refundAllCrashGame from "./refundAllCrashGame";

export default async function getGuildsAndLoadSystems() {

    const guildsId = Array.from(client.guilds.cache.keys());

    JokempoManager.load(guildsId);
    PayManager.load(guildsId);
    AfkManager.load(guildsId);
    TopGGManager.load(guildsId);
    ReminderManager.load(guildsId);
    RankingManager.checkTimeoutAndLoad();
    Database.refundAllRaces(guildsId);
    refundAllCrashGame(guildsId);

    const guildDocs = await Database.getGuilds(guildsId);

    GiveawayManager.load(guildDocs);
    TempcallManager.load(guildDocs);
    BanManager.load(guildDocs);
    AutoroleManager.load(guildDocs);

    for (const doc of guildDocs) {
        Database.setCache(doc.id, doc, "cache");
        if (doc?.Prefixes?.length)
            Database.prefixes.set(doc.id!,
                doc?.Prefixes || ["s!", "-"]);
    }

    return;
}