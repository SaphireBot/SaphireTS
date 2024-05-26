import { BlackjackData } from "../../@types/commands";
import Database from "../../database";
import Blackjack from "./blackjack";

export default async function loadCachedGameBlackjack(guildsId: string[]) {

  const cache = await Promise.all(guildsId.map(id => Database.Games.get(`Blackjack.${id}`))) as Record<string, BlackjackData>[];
  if (!cache) return;

  for (const obj of cache.filter(Boolean))
    for (const data of Object.values(obj))
      new Blackjack(undefined, data);

}