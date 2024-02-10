import Database from "../../../database";
import { ranking, battleroyaleRankingData } from "./ranking";

export default async function refresher(): Promise<any> {
    const data = (await Database.Battleroyale.find()) || [];
    ranking.wins = data.sort((a, b) => (b?.wins || 0) - (a?.wins || 0)).slice(0, 50) as battleroyaleRankingData[];
    ranking.deaths = data.sort((a, b) => (b?.deaths || 0) - (a?.deaths || 0)).slice(0, 50) as battleroyaleRankingData[];
    ranking.matches = data.sort((a, b) => (b?.matches || 0) - (a?.matches || 0)).slice(0, 50) as battleroyaleRankingData[];
    ranking.kills = data.sort((a, b) => (b?.kills || 0) - (a?.kills || 0)).slice(0, 50) as battleroyaleRankingData[];

    for (const d of data)
        ranking.me.set(d.id, { deaths: d.deaths || 0, kills: d.kills || 0, matches: d.matches || 0, wins: d.wins || 0, username: d.username || "Anonymous" });

    return setTimeout(() => refresher(), (1000 * 60) * 5);
}