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

    refundAllCrashGame(guildsId);
    JokempoManager.load();
    PayManager.load();
    RankingManager.checkTimeoutAndLoad();

    const guildDocs = await Database.getGuilds(guildsId);

    GiveawayManager.load(guildDocs);
    TempcallManager.load(guildDocs);
    BanManager.load(guildDocs);
    ReminderManager.load(guildsId);
    AutoroleManager.load(guildDocs);
    AfkManager.load(guildsId);
    TopGGManager.load(guildsId);

    for (const doc of guildDocs) {
        Database.setCache(doc.id, doc, "cache");
        if (doc?.Prefixes?.length)
            Database.prefixes.set(doc.id!,
                doc?.Prefixes || ["s!",
                    "-"]);
    }

    return;
}