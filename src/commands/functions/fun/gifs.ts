import interactions from "../../../JSON/interactions.json";
import { env } from "process";
export const interactionsEntries = Object.entries(interactions) as [string, string[]][];
export const allGifsAvailable = new Map<string, { anime_name: string, url: string }[]>();
const NekosBestEndpoints = new Set<string>();
const TenorEndpoints = new Set<string>();
const gifsByTenor = ["please", "anger", "what", "bye", "drink", "shower", "scared", "disgust", "divando", "sad", "hungry", "thankyou", "wow", "anya"];

export const endpoints = new Set<string>();
let cooldown = 0;

export async function getGifs(str: string): Promise<{ endpoint?: string, gifs?: { anime_name?: string, url: string }[] }> {

    if (!str) return {};

    const endpoint = getEndpoint(str?.toLowerCase());
    if (!endpoint || !endpoints.has(endpoint)) return {};

    const gifs = allGifsAvailable.get(endpoint) || [];
    if (gifs?.length) {

        if (gifs.length < 50)
            return { endpoint, gifs: await fetchGifByTenor(endpoint, `anime ${endpoint}`) };

        return { endpoint, gifs };
    }

    if (endpoint === "divando")
        return { endpoint, gifs: await fetchGifByTenor(endpoint, endpoint) };

    if (gifsByTenor.includes(endpoint))
        return { endpoint, gifs: await fetchGifByTenor(endpoint, `anime ${endpoint}`) };

    const data = await fetchGifsByNekosBest(endpoint);
    if (!data || !data?.length) return {};

    for (const res of data)
        if (!gifs.some((value) => value.url === res.url))
            gifs.push(res);

    allGifsAvailable.set(endpoint, gifs);
    return { endpoint, gifs };
}

export async function loadEndpoints() {

    if (env.MACHINE === "localhost") return;
    
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

    for (const endpoint of formattedEndpoints) {
        NekosBestEndpoints.add(endpoint);
        endpoints.add(endpoint);
    }

    for (const endpoint of gifsByTenor) {
        TenorEndpoints.add(endpoint);
        endpoints.add(endpoint);
    }

    return;
}

export async function loadGifs(): Promise<any> {

    await loadEndpoints();
    removeRepeatedGifs();
    // return;

    for await (let endpoint of endpoints) {
        const gifs = NekosBestEndpoints.has(endpoint)
            ? (() => {
                // await fetchGifsByNekosBest(endpoint!)
                return [];
            })()
            : await fetchGifByTenor(endpoint);
        if (!gifs?.length) continue;
        if (endpoint === "peck") endpoint = "kiss";
        if (endpoint === "nod") endpoint = "wave";
        const data = allGifsAvailable.get(endpoint) || [];
        data.push(...gifs);
        allGifsAvailable.set(endpoint!, data!);
        continue;
    }

    improveGifsQuantity();
    return;
}

function removeRepeatedGifs() {

    for (const endpoint of endpoints) {
        const gifs = allGifsAvailable.get(endpoint);
        if (!gifs?.length) continue;
        const unique = [] as { anime_name: string, url: string }[];
        for (const gif of gifs) {
            if (unique.some(v => v?.url === gif.url)) continue;
            unique.push(gif);
        }
        allGifsAvailable.set(endpoint, unique);
    }

    // return setTimeout(() => loadGifs(), (1000 * 60) * 30);
}

async function fetchGifsByNekosBest(endpoint: string) {
    if (!endpoint) return [];

    console.log("nekos.best FETCH 4");
    const gifs = await fetch(`https://nekos.best/api/v2/${endpoint}?amount=20`)
        .then(res => res.json())
        .then((res: any) => res?.results)
        .catch(() => null) as { anime_name: string, url: string }[] | null;

    if (!gifs) return [];
    return gifs;
}

export function getEndpoint(str: string) {

    let endpoint = endpoints.has(str) || allGifsAvailable.has(str)
        ? str
        : interactionsEntries.find(([key, synons]) => synons.includes(str) || key === str)?.[0];
    if (endpoint === "peck") endpoint = "kiss";
    if (endpoint === "nod") endpoint = "wave";
    return endpoint;
}

async function fetchGifByTenor(key?: string, query?: string): Promise<{ anime_name: string, url: string }[]> {
    if (!key || !query) return [];

    if (!endpoints.has(key)) endpoints.add(key);
    let gifs = allGifsAvailable.get(key);
    if (!gifs) {
        allGifsAvailable.set(key, []);
        gifs = [];
    }

    if (Date.now() < cooldown) return [];

    cooldown = Date.now() + 1500;
    const response = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURI(query)}&key=${env.TENOR_API_KEY}&client_key=${env.TENOR_CLIENT_KEY}&limit=50`)
        .then(res => res.json())
        .then((res: any) => res?.results || [])
        .then(res => res.map((d: any) => ({ anime_name: "", url: d?.media_formats?.gif?.url || "" })))
        .catch(err => {
            console.log("gifs error", err);
            return [];
        });

    if (!response?.length) return [];

    gifs.push(...response);
    allGifsAvailable.set(key, gifs);
    return gifs;
}

async function improveGifsQuantity(): Promise<any> {

    // return;

    for await (const endpoint of endpoints) {
        const gifs = allGifsAvailable.get(endpoint) || [];
        if (!gifs?.length) allGifsAvailable.set(endpoint, []);
        if (gifs.length > 50) continue;

        if (gifs.length < 50) {
            if (endpoint === "divando") await fetchGifByTenor(endpoint, endpoint);
            else await fetchGifByTenor(endpoint, `anime ${endpoint}`);
            break;
        }
    }

    for (const endpoint of endpoints)
        if ((allGifsAvailable.get(endpoint) || []).length < 50) return setTimeout(() => improveGifsQuantity(), 1500);

    return;
}