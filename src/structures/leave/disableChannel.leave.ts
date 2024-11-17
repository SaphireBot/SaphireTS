import Database from "../../database";

export default async function disableLeaveChannel(guildId: string) {
  return await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { $unset: { "LeaveNotification.channelId": true } },
    { upsert: true, new: true },
  );
}