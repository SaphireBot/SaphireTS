/* eslint-disable prefer-const */
import { APIEmbed, ButtonInteraction, EmbedBuilder, embedLength, time } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import payload from "./payload";

export default async function buttons(
  interaction: ButtonInteraction<"cached">,
) {

  const { userLocale: locale, message, user, channel } = interaction;
  const embed = message.embeds?.[0]?.toJSON() || {};
  const current = embedLength(embed);
  let msgCollector: any;

  const msg = await interaction.reply({
    content: t("embed.json.time_to_send", { e, locale, user, time: time(new Date(Date.now() + (1000 * 60)), "R") }),
    fetchReply: true,
  });

  const fileCollector = channel?.createMessageCollector({
    filter: msg => msg.author.id === user.id,
    time: 1000 * 60,
  })
    .on("collect", async (message): Promise<any> => {

      const attach = message.attachments?.first();
      if (!attach || !attach.url || !attach.contentType?.startsWith("application/json")) return;

      msgCollector?.stop();

      await msg.edit({
        content: t("embed.json.downloading", { e, locale }),
      });

      return await fetch(attach.url)
        .then(async res => {

          if (!res.ok)
            return await msg.edit({
              content: t("embed.json.downloadError", { e, locale }),
            });

          await message.delete();
          return await res.json();
        })
        .then(async json => {
          await msg.edit({
            content: t("embed.json.writing", { e, locale }),
          });

          try {
            const embed = new EmbedBuilder(json as APIEmbed);
            if (embed?.data.description) embed.setDescription(embed.data.description.limit("EmbedDescription"));
            if (embed?.data.image?.proxy_url) embed.setImage(embed.data.image.url);

            const total = embedLength(embed.data);
            if (total > 6000)
              return await msg.edit({
                content: t("embed.over_limit", { e, locale, current: current.currency(), total: total.currency() }),
              });

            await interaction.message.edit(payload(locale, user.id, message.id, embed.data));
            await msg.delete().catch(() => { });

          } catch (err) {
            return await msg.edit({
              content: t("embed.json.error", { e, locale, err }),
            });
          }

        })
        .catch(async err => {
          return await msg.edit({
            content: t("embed.json.error", { e, locale, err }),
          });
        });

    });

  msgCollector = msg.createMessageComponentCollector({
    filter: () => false,
    time: 1000 * 60,
  })
    .on("end", async (_, reason: string): Promise<any> => {
      if (reason === "time") {
        fileCollector?.stop();
        return await message.edit(payload(locale, user.id, message.id, embed));
      }
    });

  return;

}