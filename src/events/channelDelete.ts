import { Events, ChannelType } from "discord.js";
import client from "../saphire";
import { CrashManager, GiveawayManager, JokempoManager, PayManager, ReminderManager } from "../managers";
import Database from "../database";

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

    await Database.Twitch.updateMany(
        {},
        { $unset: { [`notifiers.${channel.id}`]: true } }
    );

    return;
});