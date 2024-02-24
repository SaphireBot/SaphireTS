import { ModalSubmitInteraction, Colors, resolveColor, ColorResolvable } from "discord.js";
const colorsEntries = Object.entries(Colors);
const hex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export default async function body(
  interaction: ModalSubmitInteraction<"cached">
) {

  const { message, fields } = interaction;
  const embed = message!.embeds?.[0]?.toJSON() || {};
  const color = fields.getTextInputValue("color");

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

    if (numberColor > 16777215) numberColor = 16777215;

    try {
      embed.color = resolveColor(numberColor > 0 ? numberColor : color as ColorResolvable);
    } catch (e) { delete embed.color; }

  } else delete embed.color;

  await interaction.deferUpdate();
  return await message?.edit({
    embeds: [embed],
    components: message.components
  });

}