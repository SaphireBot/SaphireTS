import { ButtonInteraction, Message, MessageFlags, PartialMessage } from "discord.js";
import Database from "../../database";
import client from "../../saphire";
import { t } from "../../translator";
import { e } from "../../util/json";
import { GlobalSystemNotificationManager } from "../../managers";
export const webhooksFeedbackUrls = new Set<string>();

export default async function webhookRestartNotification(
  message: Message<boolean> | PartialMessage | ButtonInteraction<"cached">,
) {

  const channel = message.channel;
  const user = "user" in message ? message.user : message.author;

  if (message instanceof Message)
    if (message.partial) await (message as PartialMessage)?.fetch()?.catch(() => { });

  if (
    !channel
    || !("fetchWebhooks" in channel)
    || webhooksFeedbackUrls.has(message.channelId)
    || !message.guild
  ) {

    if (
      message instanceof Message
      && message.author.id === client.user?.id
    )
      return await message.delete()?.catch(() => { });

    if (
      message instanceof ButtonInteraction
      && message.message?.author?.id === client.user?.id
    )
      return await message.update({ content: e.Animated.SaphireDance, components: [] })?.catch(() => { });

    return;
  }

  const webhook = await GlobalSystemNotificationManager.fetchWebhook(
    channel,
    true,
    {
      avatar: "https://cdn.saphire.one/saphire/web.png",
      username: "Saphire - Global System Notification",
      reason: "Created to warn about Saphire's Reboot",
    },
  );

  if (!webhook?.url) return;

  webhooksFeedbackUrls.add(message.channelId);

  await Database.Client.updateOne(
    { id: client.user!.id },
    {
      $push: {
        "rebooting.webhooks": {
          url: webhook.url,
          locale: message.guild.preferredLocale || client.defaultLocale,
        },
      },
    },
  );

  await edit();
  return await reply();

  async function edit() {
    const data: any = {
      content: t("Saphire.rebooting.message_no_emoji", {
        e,
        locale: (await user?.locale()) || client.defaultLocale,
        reason: client.rebooting?.reason || "??",
      }),
      components: [],
      flags: [MessageFlags.Ephemeral],
    };

    if (message instanceof Message) await message.edit(data).catch(() => { });
    if (message instanceof ButtonInteraction) await message.update(data).catch(() => { });
  }

  async function reply() {
    const data: any = {
      content: t("Saphire.rebooting.notification_ready", { e, locale: message.guild?.preferredLocale || client.defaultLocale }),
      flags: [MessageFlags.Ephemeral],
    };

    if (message instanceof Message) return await message.reply(data).catch(() => { });
    if (message instanceof ButtonInteraction) return await message.followUp(data).catch(() => { });
  }
}