import { Events } from "discord.js";
import client from "../saphire";
import { PearlsManager } from "../managers";
import Database from "../database";

client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
  const { guild } = newEmoji;

  if (PearlsManager.data.has(guild.id)) {
    const data = PearlsManager.data.get(guild.id)!;
    if (data?.emoji === oldEmoji.toString()) {
      data.emoji === newEmoji.toString();
      PearlsManager.data.set(guild.id, data);
      await Database.Guilds.updateOne(
        { id: guild.id },
        { $set: { "Pearls.emoji": newEmoji.toString() } }
      );
      return;
    }
  }
});