import { ButtonStyle, ChannelType, ChatInputCommandInteraction, Message, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import handler from "../../../structures/commands/handler";
import { PearlsManager } from "../../../managers";

const disable = [
  "ausschalten",
  "deaktivieren",
  "turnoff",
  "disable",
  "apagar",
  "desactivar",
  "éteindre",
  "désactiver",
  "切る",
  "無効にする",
  "desligar",
  "关闭",
  "停用",
  "off",
  "del",
];

export default async function configuration(
  interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
  args?: string[],
) {

  const { member, guild, userLocale: locale } = interactionOrMessage;
  const user = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user : interactionOrMessage.author;

  if (member?.permissions.missing([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages], true).length)
    return await permissionsMissing(
      interactionOrMessage,
      [DiscordPermissons.ManageChannels, DiscordPermissons.ManageMessages],
      "Discord_you_need_some_permissions",
    );

  if (
    !guild.members.me
    || guild.members.me.permissions.missing([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages], true).length
  )
    return await permissionsMissing(
      interactionOrMessage,
      [DiscordPermissons.ManageChannels, DiscordPermissons.ManageMessages],
      "Discord_client_need_some_permissions",
    );

  const data = PearlsManager.get(guild.id);

  let limit = interactionOrMessage instanceof ChatInputCommandInteraction
    ? interactionOrMessage.options.getInteger("limit")
    : (() => {
      if (!args?.length) return;
      return Number(args?.[0]) >= 0
        ? Number(args?.[0])
        : Number(args?.[1]) >= 0
          ? Number(args?.[1])
          : null;
    })();

  if (typeof limit === "number")
    limit = parseInt(limit.toFixed(0));

  const channel = (
    interactionOrMessage instanceof ChatInputCommandInteraction
      ? interactionOrMessage.options.getChannel("channel")
      : interactionOrMessage.mentions.channels.first()
  )
    || (
      typeof data?.channelId === "string"
        ? await guild.channels.fetch(data.channelId)
        : interactionOrMessage.channel!
    ) || interactionOrMessage.channel;

  if (
    args?.length === 1
    && typeof limit !== "number"
    && typeof data?.limit === "number"
    && channel
  ) limit = data.limit;

  if (
    limit === 0
    || disable.includes(args?.[0]?.toLowerCase() || "")
  ) {

    if (!PearlsManager.data.has(guild.id))
      return await interactionOrMessage.reply({
        content: t("pearl.already_disabled", { e, locale }),
      });

    const msg = await interactionOrMessage.reply({
      content: t("pearl.disabling", { e, locale }),
    });
    await PearlsManager.disable(guild.id);
    return await msg.edit({
      content: t("pearl.disabled", { e, locale }),
    }).catch(() => { });
  }

  if (typeof limit !== "number" || limit < PearlsManager.min || limit > PearlsManager.max) {
    const mention = handler.getApplicationCommand("pearl")!.getMention("config");
    const data = PearlsManager.data.get(guild.id!);
    let actived = "";

    if (data) {
      actived += `\n${t("pearl.actual_config", {
        e,
        locale,
        limit: data.limit,
        emoji: data.emoji,
        channel: await guild.channels.fetch(data.channelId).catch(() => null),
      })}`;
    }

    return await interactionOrMessage.reply({
      content: t("pearl.limit_range_error", {
        e,
        locale,
        prefix: (
          await Database.getPrefix({
            guildId: guild.id,
            userId: user.id,
          })
        )[0],
        pearl: t("pearl.pearl", locale),
        channel,
        slashCommand: mention ? mention : "`/pearl`",
        actived,
      }),
    });
  }

  if (
    !channel
    || ![
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
    ].includes(channel.type))
    return await interactionOrMessage.reply({
      content: t("pearl.channel_type_invalid", { e, locale }),
      ephemeral: true,
    });

  const msg = await interactionOrMessage.reply({
    content: t("pearl.saving", { e, locale }),
    fetchReply: true,
  });

  const emoji = data?.emoji || "⭐";
  const response = await PearlsManager.set(guild.id, limit, channel.id, emoji);

  if (response === true)
    return await msg.edit({
      content: t("pearl.success", { e, locale, limit, channel, emoji }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("pearl.components.buttons.choose_emoji", { locale }),
              custom_id: JSON.stringify({ c: "pearl", src: "emoji", uid: user.id }),
              style: ButtonStyle.Primary,
              emoji,
            },
          ].asMessageComponents(),
        },
      ],
    }).catch(() => { });

  return await msg.edit({ content: `${response}` }).catch(() => { });
}