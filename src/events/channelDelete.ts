import { Events, ChannelType } from "discord.js";
import client from "../saphire";
import { CrashManager, GiveawayManager, JokempoManager, PayManager, ReminderManager, TopGGManager } from "../managers";
import Database from "../database";
import { channelsInGame } from "../structures/battleroyale/battleroyale";

client.on(Events.ChannelDelete, async (channel) => {

    if (
        !channel?.id
        || channel.type === ChannelType.DM
    ) return;

    GiveawayManager.deleteAllGiveawaysFromThisChannel(channel.id);
    JokempoManager.deleteAllFromThisChannel(channel.id);
    PayManager.refundByChannelId(channel.id);
    CrashManager.bulkRefundByChannelId(channel.id);
    ReminderManager.removeAllRemindersFromThisChannel(channel.id);
    TopGGManager.deleteByChannelId(channel.id);
    channelsInGame.delete(channel.id);

    await Database.Twitch.updateMany(
        {},
        { $unset: { [`notifiers.${channel.id}`]: true } }
    );

    return;
});