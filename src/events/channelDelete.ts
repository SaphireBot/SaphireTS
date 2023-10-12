import { Events, ChannelType } from "discord.js";
import client from "../saphire";
import { CrashManager, GiveawayManager, JokempoManager, PayManager } from "../managers";

client.on(Events.ChannelDelete, async (channel) => {

    if (
        !channel?.id
        || channel.type === ChannelType.DM
    ) return;

    GiveawayManager.deleteAllGiveawaysFromThisChannel(channel.id);
    JokempoManager.deleteAllFromThisChannel(channel.id);
    PayManager.refundByChannelId(channel.id);
    CrashManager.bulkRefundByChannelId(channel.id);
    return;
});