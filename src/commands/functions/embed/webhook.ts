import {
  ButtonStyle,
  DiscordAPIError,
  Message,
  MessageFlags,
  messageLink,
  ModalSubmitInteraction,
  TextChannel,
} from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import payload from "./payload";
import client from "../../../saphire";
import isImage from "./image";
import { GlobalSystemNotificationManager } from "../../../managers";

export default async function webhook(interaction: ModalSubmitInteraction<"cached">) {

  const { userLocale: locale, fields, message, customId, guild, user } = interaction;
  const embed = message!.embeds?.[0]?.toJSON() || {};
  const channelId = JSON.parse(customId)?.ch;

  if (!message) return await interaction.deferUpdate();

  if (!Object.keys(embed).length)
    return await interaction.reply({
      content: t("embed.no_embed_found", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const [
    name,
    avatar,
  ] = [
      fields.getTextInputValue("name"),
      fields.getTextInputValue("avatar"),
    ];

  await interaction.deferUpdate();

  if (avatar?.length && !(await isImage(avatar))) {
    await message.edit(payload(locale, user.id, message.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.invalid_avatar", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });
  }

  await message.edit({
    content: t("embed.webhook.sending", { e, locale }),
    embeds: [], components: [],
  });

  const channel = await guild.channels.fetch(channelId).catch(() => null) as TextChannel | null;

  if (!channel) {
    await message.edit(payload(locale, user.id, message.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.channel_not_found", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });
  }

  let webhook = await GlobalSystemNotificationManager.fetchWebhook(channel);

  if (!webhook) {
    await interaction.editReply({
      content: t("embed.webhook.not_found_creating", { e, locale }),
    });

    webhook = await GlobalSystemNotificationManager.createWebhook(
      channel,
      {
        name: `${client.user!.username}'s Webhook`,
        reason: `${client.user!.username}'s Guild Experience`,
      },
    );

  }

  if (!webhook) {
    await interaction.editReply(payload(locale, user.id, message.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.error_to_create", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });
  }

  const msg = await webhook.send(
    {
      embeds: [embed],
      username: name,
      avatarURL: avatar,
    },
  ).catch(err => err as DiscordAPIError) as Message | DiscordAPIError;

  if (msg instanceof Message) {
    await interaction.followUp({
      content: t("embed.send.success", { e, locale }),
      flags: [MessageFlags.Ephemeral],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("embed.send.message", locale),
              emoji: "💬".emoji(),
              url: messageLink(channel.id, msg.id),
              style: ButtonStyle.Link,
            },
          ],
        },
      ],
    });
    return await message.delete().catch(() => { });

    // await interaction.editReply(payload(locale, user.id, message.id, embed));
    // return await interaction.followUp({
    //   content: t("embed.send.no_url", { e, locale }),
    // });
  }

  await interaction.editReply(payload(locale, user.id, message.id, embed));

  if (!(msg instanceof DiscordAPIError)) return;

  if (msg?.code === 50001) // Missing Access
    return await interaction.followUp({
      content: t("embed.send.missing_access", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  if (msg?.code === 50013) // Missing Permissions
    return await interaction.followUp({
      content: t("embed.send.missing_permissions", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  // Any error
  return await interaction.followUp({
    content: t("embed.send.error", {
      e,
      locale,
      code: msg?.code || 0,
      error: msg,
    }),
    flags: [MessageFlags.Ephemeral],
  });

}