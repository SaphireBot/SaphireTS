import { APIEmbed, ButtonInteraction, MessageFlags } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { imagesCache } from "./images";

export default async function buttonImage(
  interaction: ButtonInteraction,
  data: {
    c: "images"
    src: "zero" | "preview" | "next" | "last"
    uid: string
  },
) {

  const { userLocale: locale, user, message } = interaction;

  if (!data || user.id !== data.uid)
    return await interaction.reply({
      content: t("google_images.you_cannot_click_here", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const cache = imagesCache.get(message.id);
  if (!cache) return await interaction.update({ components: [] });

  let i = cache[100] as number || 0;
  const limit = Object.keys(cache).length - 2;

  if (data.src === "zero") i = 0;
  if (data.src === "preview") i = i - 1;
  if (data.src === "next") i = i + 1;
  if (data.src === "last") i = limit;

  if (i < 0) i = limit;
  if (i > limit) i = 0;

  const embed = cache[i] as APIEmbed | undefined;
  if (!embed) return await interaction.update({ components: [] });

  cache[100] = i;
  imagesCache.set(message.id, cache);
  return await interaction.update({ embeds: [embed] })
    .catch(() => imagesCache.delete(message.id));
}