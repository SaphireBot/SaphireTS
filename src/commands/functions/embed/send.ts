import { ButtonStyle, ChannelSelectMenuInteraction, PermissionsBitField, TextChannel } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import payload from "./payload";

export default async function send(interaction: ChannelSelectMenuInteraction<"cached">) {

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
    content: t("embed.send.sending", { e, locale }),
    embeds: [], components: [],
  });

  return await channel.send({ embeds: [embed] })
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
                  style: ButtonStyle.Link,
                },
              ],
            },
          ],
        });
        return await message.delete().catch(() => { });
      }

      await interaction.editReply(payload(locale, user.id, message.id, embed));
      return await interaction.followUp({
        content: t("embed.send.no_url", { e, locale }),
      });
    })
    .catch(async error => {
      await interaction.editReply(payload(locale, user.id, message.id, embed));

      if (error?.code === 50001) // Missing Access
        return await interaction.followUp({
          content: t("embed.send.missing_access", { e, locale }),
          ephemeral: true,
        });

      if (error?.code === 50013) // Missing Permissions
        return await interaction.followUp({
          content: t("embed.send.missing_permissions", { e, locale }),
          ephemeral: true,
        });

      // Any error
      return await interaction.followUp({
        content: t("embed.send.error", {
          e,
          locale,
          code: error?.code || 0,
          error,
        }),
        ephemeral: true,
      });
    });
}