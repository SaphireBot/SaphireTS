import Database from "../../../../database";
import Giveaway from "../../../../structures/giveaway/giveaway";

export default async function saveParticipants(giveaway: Giveaway): Promise<void> {

  const { Participants, MessageID } = giveaway;

  await Database.Giveaways.updateOne(
    { MessageID },
    { $set: { Participants: Participants.toArray() } },
    { upsert: true },
  );

  return;
}