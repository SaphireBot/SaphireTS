import { Events, ChannelType } from "discord.js";
import client from "../saphire";
import { CrashManager, GiveawayManager, GlobalSystemNotificationManager, JokempoManager, PayManager, PearlsManager, ReminderManager, TopGGManager } from "../managers";
import Database from "../database";
import { ChannelsInGame } from "../util/constants";
import disableWelcomeChannel from "../structures/welcome/disableChannel.welcome";
import disableLeaveChannel from "../structures/leave/disableChannel.leave";

client.on(Events.ChannelDelete, async (channel) => {

    if (
        !channel?.id
        || channel.type === ChannelType.DM
    ) return;

    GlobalSystemNotificationManager.deleteWebhook(channel);

    await Database.Guilds.updateOne(
        { id: channel.guildId },
        { $pull: { ChannelsCommandBlock: channel.id } },
        { upsert: true },
    );

    GiveawayManager.deleteAllGiveawaysFromThisChannel(channel.id);
    JokempoManager.deleteAllFromThisChannel(channel.id);
    PayManager.refundByChannelId(channel.id);
    CrashManager.bulkRefundByChannelId(channel.id);
    ReminderManager.removeAllRemindersFromThisChannel(channel.id);
    TopGGManager.deleteByChannelId(channel.id);
    ChannelsInGame.delete(channel.id);
    PearlsManager.channelDelete(channel.guildId, channel.id);

    await Database.Games.delete(`Elimination.${channel.guildId}.${channel.id}`);
    await disableWelcomeChannel(channel.guildId);
    await disableLeaveChannel(channel.guildId);
    await Database.Games.delete(`Tictactoe.${channel.guildId}.${channel.id}`);

    await Database.Twitch.updateMany(
        {},
        { $unset: { [`notifiers.${channel.id}`]: true } },
    );

    return;
});