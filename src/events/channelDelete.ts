import { Events, ChannelType } from "discord.js";
import client from "../saphire";
import { GiveawayManager } from "../managers";

client.on(Events.ChannelDelete, async (channel) => {

    if (
        !channel?.id
        || channel.type === ChannelType.DM
    ) return;

    GiveawayManager.deleteAllGiveawaysFromThisChannel(channel.id);
});