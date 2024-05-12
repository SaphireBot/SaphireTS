import { Events } from "discord.js";
import client from "../saphire";
import { PearlsManager } from "../managers";

client.on(Events.GuildEmojiDelete, async emoji => {
  await PearlsManager.emojisDelete(emoji);
});