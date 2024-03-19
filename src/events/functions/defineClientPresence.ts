import { ActivityType } from "discord.js";
import client from "../../saphire";

export default function defineClientPresence(): void {

  if (!client.user || !(typeof client.shardId !== "number")) {
    setTimeout(() => defineClientPresence(), (1000 * 60) * 2);
    return;
  }

  const state = `/setlang [Cluster ${client.clusterName} - Shard ${client.shardId}]`;

  try {

    client.user.setPresence({
      activities: [
        {
          name: "Interestelar",
          state,
          type: ActivityType.Custom
        },
      ],
      afk: false,
      shardId: client.shardId,
      status: "idle"
    });

  } catch (er) {
    setTimeout(() => defineClientPresence(), (1000 * 60) * 2);
  }

  return;
}