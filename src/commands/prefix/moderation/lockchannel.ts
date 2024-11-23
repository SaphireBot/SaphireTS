import { Message, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";

export default {
  name: "lockchannel",
  description: "[moderation] Lock commands in any channels",
  aliases: [],
  category: "moderation",
  api_data: {
    name: "lockchannel",
    description: "Bloqueie comando em qualquer canal",
    category: "Moderação",
    synonyms: [],
    tags: [],
    perms: {
      user: [DiscordPermissons.ManageChannels],
      bot: [DiscordPermissons.ManageChannels],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { member, guild, guildId, userLocale: locale, channelId, author } = message;

    if (!client.channelsCommandBlock[guildId]) client.channelsCommandBlock[guildId] = new Set();

    if (!member?.permissions.has(PermissionFlagsBits.BanMembers, true))
      return await permissionsMissing(message, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

    if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
      return await permissionsMissing(message, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

    const channelsMentions = message.mentions.channels;

    if (
      channelsMentions.size === 1
      && channelsMentions.first()?.id !== channelId
    ) {

      if (client.channelsCommandBlock[guildId].has(channelId))
        return await message.reply({
          content: t("channelLock.channel_locked_mention", { e, locale, mention: `<#${channelId}>` }),
        });

      await Database.Guilds.updateOne(
        { id: guildId },
        { $addToSet: { ChannelsCommandBlock: channelId } },
        { upsert: true },
      );

      return await message.reply({
        content: t("channelLock.locked_mention", { e, locale, mention: `<#${channelId}>` }),
      });
    }

    if (channelsMentions.size > 1) {

      const channnelsId = channelsMentions.map(ch => ch.id);
      client.channelsCommandBlock[guildId] = new Set(channnelsId);

      if (channnelsId.length)
        await Database.Guilds.updateOne(
          { id: guildId },
          { $addToSet: { ChannelsCommandBlock: { $each: channnelsId } } },
          { upsert: true },
        );

      return await message.reply({
        content: t("channelLock.lockeds", {
          e,
          locale,
          channels: channnelsId.length,
          channelsMapped: channelsMentions.map(ch => ch.toString()).join(", "),
        })
          .limit("MessageContent"),
      });
    }

    if (client.channelsCommandBlock[guildId].has(channelId))
      return await message.reply({
        content: t("channelLock.channel_already_locked", { e, locale }),
      });

    await Database.Guilds.updateOne(
      { id: guildId },
      { $addToSet: { ChannelsCommandBlock: channelId } },
      { upsert: true },
    );

    return await message.reply({
      content: t("channelLock.locked", { e, locale, user: author }),
    });

  },
};