import { setTimeout as sleep } from "timers/promises";
import interactions from "../../../JSON/interactions.json";
const interactionsEntries = Object.entries(interactions);
const allGifsAvailable = new Map<string, { anime_name: string, url: string }[]>();
let endpoints: string[] = [];

export async function getGifs(str: string): Promise<{ endpoint?: string, gifs?: { anime_name: string, url: string }[] }> {

    if (!str) return {};

    const endpoint = getEndpoint(str?.toLowerCase());
    if (!endpoint || !endpoints.includes(endpoint)) return {};

    const gifs = allGifsAvailable.get(endpoint) || [];
    if (gifs?.length) return { endpoint, gifs };

    const data = await fetch(`https://nekos.best/api/v2/${endpoint}?amount=20`, { method: "GET" })
        .then(res => res.json())
        .then((res: any) => res?.results)
        .catch(() => null) as { anime_name: string, url: string }[] | null;

    if (!data || !data?.length) return {};

    for (const res of data)
        if (!gifs.some((value) => value.url === res.url))
            gifs.push(res);

    allGifsAvailable.set(endpoint, gifs);
    return { endpoint, gifs };
}

export async function loadGifs(): Promise<any> {

    const availableEndpoints = await fetch("https://nekos.best/api/v2/endpoints", { method: "GET" })
        .then(res => res.json())
        .catch(() => null) as Record<string, { format: "png" | "gif" }> | null;

    if (!availableEndpoints)
        return setTimeout(() => loadGifs(), 1000 * 60);

    const formattedEndpoints = Object.entries(availableEndpoints)
        .map(([key, { format }]) => {
            if (format === "gif") return key;
            return "";
        })
        .filter(Boolean);

    endpoints = Array.from(new Set(formattedEndpoints));
    for await (let endpoint of formattedEndpoints) {
        const gifs = await fetchGifs(endpoint!);
        if (!gifs?.length) continue;
        if (endpoint === "peck") endpoint = "kiss";
        if (endpoint === "nod") endpoint = "wave";
        const data = allGifsAvailable.get(endpoint) || [];
        const res = gifs.filter(v => !data?.some(g => g.url === v.url));
        data.push(...res);
        allGifsAvailable.set(endpoint!, data!);
    }

    return setTimeout(() => loadGifs(), (1000 * 60) * 60);
}

async function fetchGifs(endpoint: string) {
    if (!endpoint) return [];

    const gifs = await fetch(`https://nekos.best/api/v2/${endpoint}?amount=20`)
        .then(res => res.json())
        .then((res: any) => res?.results)
        .catch(() => null) as { anime_name: string, url: string }[] | null;

    await sleep(1500);

    if (!gifs) return [];
    return gifs;
}

function getEndpoint(str: string) {
    let endpoint = interactionsEntries.find(([key, synons]) => synons.includes(str) || key === str)?.[0];
    if (endpoint === "peck") endpoint = "kiss";
    return endpoint;
}