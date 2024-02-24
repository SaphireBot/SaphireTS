import { ButtonStyle, Collection, ModalSubmitInteraction, TextChannel, Webhook } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import payload from "./payload";
import client from "../../../saphire";
import isImage from "./image";

export default async function webhook(interaction: ModalSubmitInteraction<"cached">) {

  const { userLocale: locale, fields, message, customId, guild, user } = interaction;
  const embed = message!.embeds?.[0]?.toJSON() || {};
  const channelId = JSON.parse(customId)?.ch;

  if (!message) return await interaction.deferUpdate();

  if (!Object.keys(embed).length)
    return await interaction.reply({
      content: t("embed.no_embed_found", { e, locale }),
      ephemeral: true
    });

  const [
    name,
    avatar
  ] = [
      fields.getTextInputValue("name"),
      fields.getTextInputValue("avatar")
    ];

  await interaction.deferUpdate();

  if (avatar?.length && !(await isImage(avatar))) {
    await message.edit(payload(locale, user.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.invalid_avatar", { e, locale }),
      ephemeral: true
    });
  }

  await message.edit({
    content: t("embed.webhook.sending", { e, locale }),
    embeds: [], components: []
  });

  const channel = await guild.channels.fetch(channelId).catch(() => null) as TextChannel | null;

  if (!channel) {
    await message.edit(payload(locale, user.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.channel_not_found", { e, locale }),
      ephemeral: true
    });
  }

  const webhooks = await channel.fetchWebhooks().catch(err => err) as Collection<string, Webhook> | Error;

  if (!(webhooks instanceof Collection)) {
    await interaction.editReply(payload(locale, user.id, embed));
    return await interaction.followUp({
      content: t("embed.send.missing_permissions", { e, locale }),
      ephemeral: true
    });
  }

  let webhook = webhooks.find((webhook) => webhook.owner?.id === client.user!.id);

  if (!webhook) {
    await interaction.editReply({
      content: t("embed.webhook.not_found_creating", { e, locale })
    });

    webhook = await channel.createWebhook({
      name: `${client.user!.username}'s Webhook`,
      reason: `${client.user!.username}'s Experience`
    }).catch(() => undefined);

  }

  if (!webhook) {
    await interaction.editReply(payload(locale, user.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.error_to_create", { e, locale }),
      ephemeral: true
    });
  }

  return await webhook.send({
    embeds: [embed],
    username: name,
    avatarURL: avatar?.length ? avatar : undefined
  })
    .then(async msg => {


      if (msg?.url) {
        await interaction.followUp({
          content: t("embed.send.success", { e, locale }),
          ephemeral: true,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: t("embed.send.message", locale),
                  emoji: "💬".emoji(),
                  url: msg.url,
                  style: ButtonStyle.Link
                }
              ]
            }
          ]
        });
        return await message.delete().catch(() => { });
      }

      await interaction.editReply(payload(locale, user.id, embed));
      return await interaction.followUp({
        content: t("embed.send.no_url", { e, locale })
      });
    })
    .catch(async error => {
      await interaction.editReply(payload(locale, user.id, embed));

      if (error?.code === 50001) // Missing Access
        return await interaction.followUp({
          content: t("embed.send.missing_access", { e, locale }),
          ephemeral: true
        });

      if (error?.code === 50013) // Missing Permissions
        return await interaction.followUp({
          content: t("embed.send.missing_permissions", { e, locale }),
          ephemeral: true
        });

      // Any error
      return await interaction.followUp({
        content: t("embed.send.error", {
          e,
          locale,
          code: error?.code || 0,
          error
        }),
        ephemeral: true
      });
    });
}