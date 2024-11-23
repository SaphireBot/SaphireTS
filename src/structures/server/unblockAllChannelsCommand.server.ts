import { ChannelType, Colors, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import Database from "../../database";

export default async function unblockAllChannelsCommandServer(interaction: StringSelectMenuInteraction<"cached">) {

  const { member, userLocale: locale, guild, message, guildId } = interaction;

  if (message?.partial) await message.fetch()?.catch(() => { });
  if (!client.channelsCommandBlock[guildId]) client.channelsCommandBlock[guildId] = new Set();

  if (!member?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.ManageChannels, true))
    return await permissionsMissing(interaction, [DiscordPermissons.ManageChannels], "Discord_client_need_some_permissions");

  if (!client.channelsCommandBlock[guildId].size)
    return await interaction.reply({
      content: t("channelLock.no_locked_channel", { e, locale }),
      ephemeral: true,
    });

  client.channelsCommandBlock[guildId] = new Set();
  await Database.Guilds.updateOne(
    { id: guildId },
    { $set: { ChannelsCommandBlock: [] } },
    { upsert: true },
  );

  return await interaction.update({
    embeds: [{
      color: Colors.Blue,
      title: `${t("channelLock.embed.title", { e, locale })}`,
      description: t("channelLock.no_channels", locale),
      footer: {
        text: `❤️ ${client.user!.username}'s Experience`,
      },
    }],
    components: [
      {
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "server", uid: member!.id }),
          placeholder: t("welcome.components.select_menu.lauch.placeholder", locale),
          options: [
            {
              label: t("channelLock.to_home", locale),
              emoji: parseEmoji(e.Gear),
              description: t("channelLock.back_to_home", locale),
              value: "refresh",
            },
            {
              label: t("channelLock.unblock_all", locale),
              emoji: parseEmoji("🔓"),
              description: t("channelLock.unblock_channels_description", locale),
              value: "unblock_all",
            },
            {
              label: t("keyword_cancel", locale),
              emoji: e.DenyX,
              description: t("help.selectmenu.options.4.description", locale),
              value: "cancel",
            },
          ],
        }],
      },
      {
        type: 1,
        components: [{
          type: 8,
          custom_id: JSON.stringify({ c: "server", src: "channel_block", uid: member!.id }),
          placeholder: t("channelLock.choose_channel_to_lock", locale),
          min_values: 0,
          max_values: 25,
          channel_types: [
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText,
          ],
        }],
      },
    ] as any[],
  });
}