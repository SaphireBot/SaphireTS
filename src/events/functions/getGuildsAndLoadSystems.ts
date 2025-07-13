import { loadGifs } from "../../commands/functions/fun/gifs";
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
    TopGGManager,
    PearlsManager,
} from "../../managers";
import client from "../../saphire";
import loadCachedGameBlackjack from "../../structures/blackjack/loadCachedGame";
import loadCachedGameGlass from "../../structures/glass/loadCachedGame";
import { QuizCharactersManager, QuizRankingRefresher } from "../../structures/quiz";
import defineClientPresence from "./defineClientPresence";
import refundAllBichoGames from "./refundAllBichoGames";
import refundAllCrashGame from "./refundAllCrashGame";

export default async function getGuildsAndLoadSystems() {

    const guildsId = Array.from(client.guilds.cache.keys());

    // if (process.env.MACHINE === "localhost") return;
    
    refundAllBichoGames();
    JokempoManager.load(guildsId);
    PayManager.load(guildsId);
    AfkManager.load(guildsId);
    TopGGManager.load(guildsId);
    ReminderManager.load(guildsId);
    RankingManager.checkTimeoutAndLoad();
    Database.refundAllRaces(guildsId);
    refundAllCrashGame(guildsId);
    loadCachedGameGlass(guildsId);
    loadCachedGameBlackjack(guildsId);

    const guildDocs = await Database.getGuilds(guildsId);

    GiveawayManager.load(guildDocs);
    TempcallManager.load(guildDocs);
    BanManager.load(guildDocs);
    AutoroleManager.load(guildDocs);
    PearlsManager.load(guildDocs);

    for await (const doc of guildDocs) {
        if (!doc) continue;

        if (!doc.id) {
            await Database.Guilds.deleteOne({ _id: doc._id });
            continue;
        }

        client.channelsCommandBlock[doc.id] = new Set(doc.ChannelsCommandBlock);

        if (doc?.Prefixes?.length)
            Database.prefixes.set(
                doc.id!,
                Array.from(
                    new Set(doc?.Prefixes || client.defaultPrefixes),
                ),
            );
    }
    loadGifs();
    defineClientPresence();
    QuizCharactersManager.load();
    setInterval(() => QuizRankingRefresher(), (1000 * 60) * 5);

    return;
}