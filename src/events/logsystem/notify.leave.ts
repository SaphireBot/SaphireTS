import { GuildMember, PartialGuildMember } from "discord.js";
import Database from "../../database";
import disableLeaveChannel from "../../structures/leave/disableChannel.leave";
import payloadLeave from "../../structures/leave/payload.leave";
import { GlobalSystemNotificationManager } from "../../managers";

const notifyAfter: Record<string, number> = {};

export default async function checkBeforeNotifyLeaveMessage(member: GuildMember | PartialGuildMember) {

  if (!notifyAfter[member.guild.id])
    notifyAfter[member.guild.id] = Date.now() - 1;

  if (notifyAfter[member.guild.id] > Date.now()) {
    setTimeout(async () => await notifyLeave(member), notifyAfter[member.guild.id] - Date.now());
    notifyAfter[member.guild.id] += 2000;
  } else {
    notifyAfter[member.guild.id] = Date.now() + 2000;
    await notifyLeave(member);
  }

  return;

}

async function notifyLeave(member: GuildMember | PartialGuildMember) {

  const { guild } = member;
  const data = await Database.getGuild(guild.id);
  const leave = data.LeaveNotification;

  if (
    !leave
    || !leave.active
    || !leave.channelId
  ) return;

  const channel = await guild.channels.fetch(leave.channelId).catch(() => null);
  if (
    !channel
    || !channel.isTextBased()
    || !("send" in channel)
  ) return await disableLeaveChannel(guild.id);

  const payload = payloadLeave(data, member);
  if (!payload.content && !payload.embeds.length)
    return await disableLeaveNotify(guild.id);

  GlobalSystemNotificationManager.setPayloadToSendWithClient(channel, payload);

  // return await channel.send(payload)
  //   .catch(async err => {
  //     console.log(err);
  //     return await disableLeaveNotify(guild.id);
  //   });
}

async function disableLeaveNotify(guildId: string) {
  return await Database.Guilds.updateOne(
    { id: guildId },
    { $set: { "LeaveNotification.active": false } },
    { upsert: true },
  );
}