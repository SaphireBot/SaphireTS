import Database from "../../database";

export default async function disableWelcomeChannel(guildId: string) {
  return await Database.Guilds.findOneAndUpdate(
    { id: guildId },
    { $unset: { "WelcomeNotification.channelId": true } },
    { upsert: true, new: true },
  );
}