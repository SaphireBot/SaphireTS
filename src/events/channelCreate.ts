import { Events, PermissionFlagsBits } from "discord.js";
import client from "../saphire";
import { e } from "../util/json";
import Database from "../database";

client.on(Events.ChannelCreate, async (channel): Promise<any> => {

  if (!channel.isTextBased()) return;

  const { guild, guildId } = channel;
  if (!guild.members.me) return;

  if (
    !channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    || !channel.isTextBased()
  )
    return;

  const data = await Database.getGuild(guildId);
  if (data?.FirstSystem)
    return await channel.send({ content: `First! ${e.Animated.SaphireDance}` })
      .catch(() => { });
});