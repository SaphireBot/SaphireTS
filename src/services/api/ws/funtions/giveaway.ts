import { GiveawayManager } from "../../../../managers";
import { CallbackType } from "../websocket.manager";

export default async (
    giveawayId: string | undefined,
    callback: CallbackType
) => callback(GiveawayManager.cache.get(giveawayId || "?")?.toJSON())
