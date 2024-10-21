import { APIEmbed, ModalSubmitInteraction, embedLength } from "discord.js";
import payload from "./payload";
import isImage from "./image";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function body(
  interaction: ModalSubmitInteraction<"cached">,
) {

  const { message, fields, userLocale: locale, user } = interaction;
  const embed: APIEmbed = message?.embeds?.[0]?.toJSON() || {};
  const current = embedLength(embed);

  const [
    url,
    image,
    thumbnail,
    author,
  ] = [
      fields.getTextInputValue("url"),
      fields.getTextInputValue("image"),
      fields.getTextInputValue("thumbnail"),
      fields.getTextInputValue("author"),
    ];

  if (url && url.isURL())
    embed.url = url;
  else delete embed.url;

  if (image && (await isImage(image)))
    embed.image = { url: image };
  else delete embed.image;

  if (thumbnail && (await isImage(thumbnail)))
    embed.thumbnail = { url: thumbnail };
  else delete embed.thumbnail;

  if (author && (await isImage(author)) && embed.author?.name)
    embed.author = { icon_url: author, name: embed.author?.name };
  else delete embed.author?.icon_url;

  await interaction.deferUpdate();

  const total = embedLength(embed);
  if (total > 6000)
    return await interaction.followUp({
      content: t("embed.over_limit", { e, locale, current: current.currency(), total: total.currency() }),
      ephemeral: true,
    });

  return await message?.edit(payload(locale, user.id, message.id, embed));

}