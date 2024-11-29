import { APIEmbed, ButtonInteraction, ButtonStyle, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, Colors, Message, NonThreadGuildBasedChannel, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";
import payloadServer from "./payload.server";
import { CollectorReasonEnd } from "../../@types/commands";

export default async function channelLockServer(
  interaction: StringSelectMenuInteraction<"cached"> | Message<true> | ChannelSelectMenuInteraction<"cached"> | ChatInputCommandInteraction<"cached">,
) {

  const { member, userLocale: locale, guild, guildId } = interaction;
  if (!member) return;

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  let message: Message | undefined = undefined;

  if (interaction instanceof Message)
    message = await interaction.reply({ content: t("channelLock.loading", { e, locale }) });

  if (interaction instanceof ChatInputCommandInteraction)
    message = await interaction.followUp({ content: t("channelLock.loading", { e, locale }), fetchReply: true });

  if (interaction instanceof StringSelectMenuInteraction)
    message = await interaction.update({ content: t("channelLock.loading", { e, locale }), embeds: [], components: [], fetchReply: true });

  if (interaction instanceof ChannelSelectMenuInteraction)
    message = await interaction.update({
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              emoji: parseEmoji(e.Loading)!,
              custom_id: "loading",
              style: ButtonStyle.Primary,
              disabled: true,
            },
          ],
        },
      ],
      fetchReply: true,
    });

  if (!message) return;
  if (message.partial) await message.fetch()?.catch(() => { });
  let data = await Database.getGuild(guildId);
  let channelsBlock = client.channelsCommandBlock[guildId];

  if (!channelsBlock?.size) {
    if (data.ChannelsCommandBlock?.length)
      client.channelsCommandBlock[guildId] = new Set(data.ChannelsCommandBlock);
    else client.channelsCommandBlock[guildId] = new Set();
    channelsBlock = client.channelsCommandBlock[guildId];
  }

  const guildChannels = await guild.channels.fetch().catch(() => null);

  if (!guildChannels?.size) {
    await message.edit(await payloadServer(data, locale, guild, member)).catch(() => { });
    await sleep(1500);

    if (interaction instanceof Message)
      return await message.reply({ content: t("channelLock.no_channels_found", { e, locale }) });
    else return await interaction.followUp({ content: t("channelLock.no_channels_found", { e, locale }), ephemeral: true });
  }

  const channelsToDelete: string[] = [];
  const channelsBlocked = Array.from(channelsBlock)
    .map(channelId => {
      const channel = guildChannels.get(channelId);
      if (channel) return channel;
      channelsToDelete.push(channelId);
      return;
    })
    .filter(Boolean) as NonThreadGuildBasedChannel[];

  if (channelsToDelete.length) {
    data = await Database.Guilds.findOneAndUpdate(
      { id: guildId },
      { $pullAll: { ChannelsCommandBlock: channelsToDelete } },
      { upsert: true, new: true },
    );

    client.channelsCommandBlock[guildId] = new Set(data.ChannelsCommandBlock);
    channelsBlock = client.channelsCommandBlock[guildId];
    if (interaction instanceof Message)
      return await message.reply({ content: t("channelLock.channels_not_found", { e, locale, channels: channelsToDelete.length }) });
    else return await interaction.followUp({ content: t("channelLock.channels_not_found", { e, locale, channels: channelsToDelete.length }), ephemeral: true });
  }

  let embeds: APIEmbed[] = [];
  let components: any[] = [];
  let i = 0;

  await buildEmbeds();
  loadComponents();

  await sleep(1500);

  await message.edit({
    content: null,
    embeds: [embeds[0]],
    components,
  });

  if (embeds.length <= 1) return;

  const collector = message.createMessageComponentCollector({
    filter: int => int.user.id === member.id,
    idle: (1000 * 60) * 5,
  })
    .on("collect", async int => {

      if (int instanceof StringSelectMenuInteraction)
        return collector.stop();

      if (int instanceof ButtonInteraction)
        return await changePageState(int);

    })
    .on("end", async (_, reason: CollectorReasonEnd) => {
      if (reason === "time" || reason === "idle")
        return await message.edit(await payloadServer(data, locale, guild, member)).catch(() => { });
    });

  async function changePageState(int: ButtonInteraction) {

    const customId = int.customId as "zero" | "next" | "refresh" | "previous" | "last" | "refreshServer";

    if (customId === "refreshServer")
      return collector.stop();

    if (customId === "zero") i = 0;

    if (customId === "next") {
      i++;
      if (!embeds[i]) i = 0;
    };

    if (customId === "refresh") {
      await buildEmbeds();
      if (!embeds[i]) i = 0;
    }

    if (customId === "previous") {
      i--;
      if (!embeds[i]) i = embeds.length - 1;
    };

    if (customId === "last") i = embeds.length - 1;

    return await int.update({ embeds: [embeds[i]], components: loadComponents() })
      .catch(async err => {
        console.log(err);
        await buildEmbeds();
        i = 0;
        await sleep(2000);
        return await message?.edit({ embeds: [embeds[i]], components })?.catch(() => collector.stop());
      });
  }

  async function buildEmbeds() {

    embeds = [];
    let page = 1;
    const length = (channelsBlocked.length / 10) <= 1 ? 1 : parseInt((channelsBlocked.length / 10).toFixed(0));
    const prefix = (await Database.getPrefix({ guildId, userId: member!.id })).random();
    const slash = client.application?.commands.getByName("channel")?.getMention("commands") || `${e.Animated.SaphireQuestion}`;

    const fields = [{
      name: t("channelLock.embed.field_name", { e, locale }),
      value: t("channelLock.embed.field_value", { e, locale, prefix, slash }),
    }];

    if (channelsBlocked.length >= 25)
      fields.push({
        name: t("channelLock.embed.field_name_limit", locale),
        value: t("channelLock.embed.field_value_limit", { e, locale, prefix, slash }),
      });

    if (!channelsBlocked.length)
      embeds.push({
        color: Colors.Blue,
        title: `${t("channelLock.embed.title", { e, locale })}`,
        description: t("channelLock.no_channels", locale),
        fields,
        footer: {
          text: `❤️ ${client.user!.username}'s Guild Experience`,
        },
      });

    for (let i = 0; i < channelsBlocked.length; i += 10) {

      const pageCount = length > 1 ? ` - ${page}/${length}` : "";

      embeds.push({
        color: Colors.Blue,
        title: `${t("channelLock.embed.title", { e, locale })}${pageCount}`,
        description: channelsBlocked
          .slice(i, i + 10)
          .map(ch => `\`${ch.id}\` ${ch.toString()}`)
          .join("\n") || t("channelLock.no_channels", locale),
        fields,
        footer: {
          text: `❤️ ${client.user!.username}'s Guild Experience`,
        },
      });

      page++;
    }

  }

  function loadComponents() {
    components = [];

    if (embeds.length > 1)
      components.push({
        type: 1,
        components: [
          {
            type: 2,
            emoji: parseEmoji("⏮️"),
            custom_id: "zero",
            style: ButtonStyle.Primary,
            disabled: i === 0,
          },
          {
            type: 2,
            emoji: parseEmoji("◀️"),
            custom_id: "previous",
            style: ButtonStyle.Primary,
            disabled: i <= 0,
          },
          {
            type: 2,
            emoji: parseEmoji(e.Loading),
            custom_id: "refresh",
            style: ButtonStyle.Primary,
            disabled: false,
          },
          {
            type: 2,
            emoji: parseEmoji("▶️"),
            custom_id: "next",
            style: ButtonStyle.Primary,
            disabled: i >= embeds.length - 1,
          },
          {
            type: 2,
            emoji: parseEmoji("⏭️"),
            custom_id: "last",
            style: ButtonStyle.Primary,
            disabled: i === embeds.length - 1,
          },
        ],
      });

    components.push({
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
    });

    if (channelsBlocked.length < 25)
      components.push({
        type: 1,
        components: [{
          type: 8,
          custom_id: JSON.stringify({ c: "server", src: "channel_block", uid: member!.id }),
          placeholder: t("channelLock.choose_channel_to_lock", locale),
          min_values: 0,
          max_values: 25,
          default_values: channelsBlocked.map(ch => ({ id: ch.id, type: "channel" })),
          channel_types: [
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText,
          ],
        }],
      });

    return components;
  }

}