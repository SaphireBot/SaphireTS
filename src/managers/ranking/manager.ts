import Database from "../../database";
import client from "../../saphire";

export default class RankingManager {
    constructor() { }

    async load() {
        const fields = [
            { key: "balance", tag: "Balance", path: "Balance" },
            { key: "likes", tag: "Likes", path: "Likes", },
            { key: "level", tag: "Level", path: "Level" },
            { key: "daily", tag: "DailyCount", path: "DailyCount" },
            { key: "logomarca", tag: "Logomarca", path: "GamingCount.Logomarca" },
            { key: "flags", tag: "FlagCount", path: "GamingCount.FlagCount" },
            { key: "quiz_anime", tag: "QuizAnime", path: "GamingCount.QuizAnime" },
            { key: "quiz_questions", tag: "QuizQuestions", path: "GamingCount.QuizQuestions" }
        ];

        const documents = await Database.Users.find({}, "id " + fields.map(d => d.path).join(" "));
        if (!documents?.length) {
            await Database.Ranking.json.mSet([
                { key: "data", path: "$.lastUpdate", value: Date.now() },
                { key: "data", path: "$.nestUpdate", value: Date.now() + (1000 * 60 * 15) }
            ]);
            return await Database.Ranking.json.set("data", "$.lastUpdate", Date.now());
        }

        const top: Record<string, string> = {};
        const data = await Promise.all(fields.map(f => getData(f.path, f.key)));

        for await (const d of data) {
            const value = Object.entries(d.value);
            if (!value?.length) continue;
            top[d.key] = value[0][0];
            const zAdd = value.map(([userId, { value }]) => ({ score: value, value: userId }));
            await Database.Ranking.zAdd(d.key, zAdd, { LT: true, GT: true });
            continue;
        }

        return await Database.Ranking.json.set("data", "$", {
            nextUpdate: Date.now() + (1000 * 60 * 15),
            lastUpdate: Date.now(),
            types: fields.map(d => d.key),
            top
        });

        async function getData(path: string, key: string): Promise<{ key: string, path: "$", value: Record<string, { value: number, index: number }> }> {
            const value: Record<string, { value: number, index: number }> = {};

            path.includes(".")
                ? (() => {
                    const broke = path.split(".");
                    (documents as any[])
                        .filter(data => data[broke[0]][broke[1]] && data[broke[0]][broke[1]] > 0)
                        .sort((a, b) => b[broke[0]][broke[1]] - a[broke[0]][broke[1]])
                        .map((d, i) => value[d.id] = { value: d[broke[0]][broke[1]], index: i + 1 });
                })()
                : (documents as any[])
                    .filter(data => data[path] && data[path] > 0)
                    .sort((a, b) => b[path] - a[path])
                    .map((d, i) => value[d.id] = { value: d[path], index: i + 1 });

            return { key, path: "$", value };
        }
    }

    async checkTimeoutAndLoad() {
        if (client.shardId !== 0) return;
        const nextUpdate: number = (await Database.Ranking.json.get("data", { path: "$.nextUpdate" }) as any)?.[0] as number || 0;

        if (nextUpdate > Date.now())
            return setTimeout(async () => this.load(), nextUpdate - Date.now());

        this.load();
        return setTimeout(() => this.load(), 1000 * 60 * 15);
    }
}