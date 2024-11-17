import { ModalSubmitInteraction, Colors, HexColorString, resolveColor, embedLength, EmbedBuilder } from "discord.js";
import payload, { payloadEmbedsColors } from "./payload";
import { t } from "../../../translator";
import { e } from "../../../util/json";
const colorsEntries = Object.entries(Colors);
const hex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export default async function body(
  interaction: ModalSubmitInteraction<"cached">,
) {

  const { message, fields, userLocale: locale, user } = interaction;
  if (!message) return;
  const embed = new EmbedBuilder(message!.embeds?.[0]?.toJSON() || {}).data;
  const current = embedLength(embed);

  const [
    title,
    description,
    author,
    color,
  ] = [
      fields.getTextInputValue("title"),
      fields.getTextInputValue("description"),
      fields.getTextInputValue("author"),
      fields.getTextInputValue("color") as number | HexColorString | keyof typeof Colors | "Random",
    ];

  if (author?.length) {
    if (!embed.author) embed.author = { name: author };
    else embed.author.name = author;
  } else delete embed.author;

  if (title?.length) embed.title = title;
  else delete embed.title;

  if (description?.length) embed.description = description;
  else delete embed.description;

  if (
    color
    && (
      (
        typeof color === "string"
        && hex.test(color)
      )
      || !isNaN(Number(color))
      || (
        typeof color === "string"
        && (
          Colors[color as keyof typeof Colors]
          || colorsEntries.some(([name]) => name.toLowerCase() === color.toLowerCase())
        )
      )
    )
  ) {
    let numberColor = (colorsEntries.find(([name]) => name.toLowerCase() === color)?.[1] || 0) as number;
    if (Number(color) > 0) numberColor = Number(color) || 0;

    if (
      numberColor < 0
      && numberColor > 16777215
    ) numberColor = 0;

    try {
      embed.color = resolveColor(numberColor > 0 ? numberColor : color);
    } catch (err) {
      if (err) { }
      delete embed.color;
      delete payloadEmbedsColors[message.id];
    }

  } else {
    delete embed.color;
    delete payloadEmbedsColors[message.id];
  };

  await interaction.deferUpdate();

  const total = embedLength(embed);
  if (total > 6000)
    return await interaction.followUp({
      content: t("embed.over_limit", { e, locale, current: current.currency(), total: total.currency() }),
      ephemeral: true,
    });

  payloadEmbedsColors[message.id] = embed.color;
  return await message?.edit(payload(locale, user.id, message.id, embed));

}