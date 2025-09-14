import { GuildMember } from "discord.js";
import Database from "../../database";
import disableWelcomeChannel from "../../structures/welcome/disableChannel.welcome";
import payloadWelcome from "../../structures/welcome/payload.welcome";
import { GSNManager } from "../../managers";

const notifyAfter: Record<string, number> = {};

export default async function checkBeforeNotifyWelcomeMessage(member: GuildMember) {

  if (!notifyAfter[member.guild.id])
    notifyAfter[member.guild.id] = Date.now() - 1;

  if (notifyAfter[member.guild.id] > Date.now()) {
    setTimeout(async () => await notifyWelcome(member), notifyAfter[member.guild.id] - Date.now());
    notifyAfter[member.guild.id] += 2000;
  } else {
    notifyAfter[member.guild.id] = Date.now() + 2000;
    await notifyWelcome(member);
  }

  return;

}

async function notifyWelcome(member: GuildMember) {

  const { guild } = member;
  const data = await Database.getGuild(guild.id);
  const welcome = data.WelcomeNotification;

  if (
    !welcome
    || !welcome.active
    || !welcome.channelId
  ) return;

  const channel = await guild.channels.fetch(welcome.channelId).catch(() => null);
  if (
    !channel
    || !channel.isTextBased()
    || !("send" in channel)
  ) return await disableWelcomeChannel(guild.id);

  const payload = payloadWelcome(data, member);
  if (!payload.content && !payload.embeds.length)
    return await disableWelcomeNotify(guild.id);

  return GSNManager.setPayloadToSendWithClient(channel, payload);
}

async function disableWelcomeNotify(guildId: string) {
  return await Database.Guilds.updateOne(
    { id: guildId },
    { $set: { "WelcomeNotification.active": false } },
    { upsert: true },
  );
}