import { ChatInputCommandInteraction } from "discord.js";
import Database from "../../../../../database";
import client from "../../../../../saphire";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import channelLockServer from "../../../../../structures/server/channelLock.server";

export default async function channelsCommands(
  interaction: ChatInputCommandInteraction<"cached">,
) {

  const { options, guildId, guild, userLocale: locale } = interaction;
  const toLock = options.getChannel("lock");
  const toUnlock = await guild.channels.fetch(options.getString("unlock") || "").catch(() => undefined);

  if (!client.channelsCommandBlock[guildId])
    client.channelsCommandBlock[guildId] = new Set();

  if (!toLock && !toUnlock) {
    const msg = await interaction.reply({
      content: t("channelLock.no_channels_mentioned", { e, locale }),
      fetchReply: true,
    });
    await sleep(3000);
    await channelLockServer(interaction);
    return await msg.delete()?.catch(() => { });
  }

  let content = "";

  if (toLock) {
    client.channelsCommandBlock[guildId].add(toLock.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      { $addToSet: { ChannelsCommandBlock: toLock.id } },
      { upsert: true },
    );
    content += `${t("channelLock.locked_slash", { e, locale, channel: toLock.toString() })}`;
  }

  if (toUnlock) {
    client.channelsCommandBlock[guildId].delete(toUnlock.id);
    await Database.Guilds.updateOne(
      { id: guildId },
      { $pull: { ChannelsCommandBlock: toUnlock.id } },
      { upsert: true },
    );
    content += `\n${t("channelLock.unlocked", { e, locale, channel: toUnlock.toString() })}`;
  }

  return await interaction.reply({ content });
}