import { Events, PermissionFlagsBits } from "discord.js";
import client from "../saphire";
import { e } from "../util/json";

client.on(Events.ChannelCreate, async (channel): Promise<any> => {

  if (!channel.isTextBased()) return;

  const { guild } = channel;
  if (!guild.members.me) return;

  if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages))
    return;

  if (Math.floor(Math.random() * 100) > 50)
    return await channel.send({ content: `First ${e.Animated.SaphireDance}` })
      .catch(() => { });
});