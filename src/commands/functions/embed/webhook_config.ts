import { ButtonStyle, ChannelSelectMenuInteraction, Collection, PermissionsBitField, TextChannel, Webhook } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import payload from "./payload";
import client from "../../../saphire";

export default async function webhook_config(interaction: ChannelSelectMenuInteraction<"cached">) {

  const { channels, userLocale: locale, message, user, member } = interaction;
  const channel = channels.first() as TextChannel;

  if (!channel)
    return await interaction.reply({
      content: t("embed.send.no_channel", { e, locale }),
      ephemeral: true,
    });

  if (!channel?.isTextBased())
    return await interaction.reply({
      content: t("embed.send.no_text_based", { e, locale }),
      ephemeral: true,
    });

  if (!channel.permissionsFor(member, true).has(PermissionsBitField.Flags.SendMessages, true))
    return await interaction.reply({
      content: t("embed.no_permissions", { e, locale }),
      ephemeral: true,
    });

  const embed = message.embeds?.[0]?.toJSON() || {};

  if (!Object.keys(embed).length) {
    await interaction.reply({
      content: t("embed.no_embed_found", { e, locale }),
      ephemeral: true,
    });
    return await message.edit({ components: message.components });
  }

  await interaction.update({
    content: t("embed.webhook.loading", { e, locale }),
    embeds: [], components: [],
  });

  const webhooks = await channel.fetchWebhooks().catch(err => err) as Collection<string, Webhook> | Error;

  if (!(webhooks instanceof Collection)) {
    await interaction.editReply(payload(locale, user.id, message.id, embed));
    return await interaction.followUp({
      content: t("embed.send.missing_permissions", { e, locale }),
      ephemeral: true,
    });
  }

  let webhook = webhooks.find((webhook) => webhook.owner?.id === client.user!.id);

  if (!webhook) {
    await interaction.editReply({
      content: t("embed.webhook.not_found_creating", { e, locale }),
    });

    webhook = await channel.createWebhook({
      name: `${client.user!.username}'s Webhook`,
      reason: `${client.user!.username}'s Guild Experience`,
    }).catch(() => undefined);

  }

  if (!webhook) {
    await interaction.editReply(payload(locale, user.id, message.id, embed));
    return await interaction.followUp({
      content: t("embed.webhook.error_to_create", { e, locale }),
      ephemeral: true,
    });
  }

  await interaction.editReply({
    content: null,
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("embed.components.json_up.0", locale),
            emoji: "⬅️".emoji(),
            custom_id: JSON.stringify({ c: "embed", src: "back", uid: user.id }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            label: t("embed.webhook.define_data", locale),
            emoji: "📝".emoji(),
            custom_id: JSON.stringify({ c: "embed", src: "def_webhook", uid: user.id, ch: channel.id }),
            style: ButtonStyle.Success,
          },
        ],
      },
    ],
  });

  return await interaction.followUp({
    content: t("embed.webhook.found", { e, locale }),
    ephemeral: true,
  });
}