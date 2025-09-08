import { APIEmbed, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import fetchImages from "./fetch.images";
import client from "../../../saphire";
export const imagesCache = new Collection<string, Record<number, APIEmbed | number>>();

export default async function images(
  interaction: Message<true> | ChatInputCommandInteraction,
  args?: string[],
) {

  const query = interaction instanceof Message
    ? encodeURI(args?.join(" ") || "")
    : encodeURI(interaction.options.getString("search") || "");

  const { userLocale: locale } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;

  if (!query?.length)
    return await interaction.reply({
      content: t("google_images.no_query", { e, locale }),
    });

  const msg = await interaction.reply({
    content: t("google_images.loading", { e, locale }),
    fetchReply: true,
  })
    .catch(() => undefined);

  if (!msg) return;

  const lr: string = {
    "de": "lang_de",
    "en-US": "lang_en",
    "es-ES": "lang_es",
    "fr": "lang_fr",
    "ja": "lang_ja",
    "zh-CN": "lang_zh-CN",
    "pt-BR": "lang_pt",
  }[locale as string || client.defaultLocale] || client.defaultLocale;

  const gl: string = {
    "de": "de",
    "en-US": "us",
    "es-ES": "es",
    "fr": "fr",
    "ja": "jp",
    "zh-CN": "cn",
    "pt-BR": "br",
  }[locale as string || client.defaultLocale] || client.defaultLocale;

  const images = await fetchImages(query.slice(0, 2048), lr, gl);
  if (!images || !images.length)
    return await edit({
      content: t("google_images.no_response", { e, locale }),
    });

  const embeds: APIEmbed[] = [];
  const cache = {} as Record<number, APIEmbed | number>;

  let i = 0;
  for (const image of images) {
    const embed = {
      color: Colors.Blue,
      title: image.title.limit("EmbedTitle"),
      url: image.link,
      image: { url: image.link },
      footer: {
        text: "Powered by Google Images",
        icon_url: "https://cdn.saphire.one/saphire/google_logo.png",
      },
    };
    cache[i] = embed;
    i++;
    embeds.push(embed);
  }

  cache[100] = 0;
  imagesCache.set(msg.id, cache);
  return await edit({
    content: null,
    embeds: [embeds[0]],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            emoji: "⏪",
            custom_id: JSON.stringify({ c: "images", src: "zero", uid: user.id }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: "⬅️",
            custom_id: JSON.stringify({ c: "images", src: "preview", uid: user.id }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: "➡️",
            custom_id: JSON.stringify({ c: "images", src: "next", uid: user.id }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: "⏩",
            custom_id: JSON.stringify({ c: "images", src: "last", uid: user.id }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: e.Trash,
            custom_id: JSON.stringify({ c: "delete", uid: user.id }),
            style: ButtonStyle.Danger,
          },
        ],
      },
    ],
  });

  async function edit(payload: any) {
    if (interaction instanceof Message) {
      if (msg)
        return await msg.edit(payload).catch(() => { });
      return;
    }

    return await interaction.editReply(payload).catch(() => { });
  }
}