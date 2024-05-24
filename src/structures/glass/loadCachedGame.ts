import { GlassData } from "../../@types/commands";
import Database from "../../database";
import GlassesWar from "./GlassesWar";

export default async function loadCachedGame(guildsId: string[]) {

  const cache = await Promise.all(guildsId.map(id => Database.Games.get(`Glasses.${id}`))) as Record<string, GlassData>[];
  if (!cache) return;

  for (const obj of cache.filter(Boolean))
    for (const data of Object.values(obj))
      new GlassesWar(data);

}