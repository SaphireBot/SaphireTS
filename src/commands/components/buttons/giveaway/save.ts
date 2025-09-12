import Database from "../../../../database";
import Giveaway from "../../../../structures/giveaway/giveaway";

export default async function saveParticipants(giveaway: Giveaway) {

  let participants = giveaway.Participants.toArray();

  if (!participants.length)
    await Database.Guilds.findOne({
      id: giveaway.GuildId,
    })
      .then(doc => doc?.Giveaways?.find(gw => gw.MessageID === giveaway.MessageID))
      .then(gw => participants = gw?.Participants || []);

  await Database.Guilds.updateOne(
    { id: giveaway.GuildId, "Giveaways.MessageID": giveaway.MessageID },
    { $set: { "Giveaways.$.Participants": participants } },
    { upsert: true },
  );
}