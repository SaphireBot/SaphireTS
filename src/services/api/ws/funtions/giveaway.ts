import { GiveawayManager } from "../../../../managers";
import { CallbackType } from "../websocket.manager";

export default async function getGiveaway(
    giveawayId: string | undefined,
    callback: CallbackType
) {
    if (!giveawayId) return callback(null);
    const giveaway = GiveawayManager.cache.get(giveawayId);
    if (!giveaway) return callback(null);
    return callback(giveaway.toJSON());
}