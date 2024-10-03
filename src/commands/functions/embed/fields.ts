import { ModalSubmitInteraction, embedLength } from "discord.js";
import payload from "./payload";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function fields(
  interaction: ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, message, user, fields, customId } = interaction;
  if (!message) return;
  const embed = message!.embeds?.[0]?.toJSON() || {};
  const current = embedLength(embed);
  const index = JSON.parse(customId)?.index ? Number(JSON.parse(customId)?.index) : -1;

  if (!embed.fields) embed.fields = [];

  const [
    name,
    value,
    inline,
    deleteField,
  ] = [
      fields.getTextInputValue("name"),
      fields.getTextInputValue("value"),
      ["ja", "yes", "sí", "oui", "はい", "sim", "是的", "si", "s", "y"].includes((fields.getTextInputValue("inline") || "").toLowerCase()),
      index >= 0 ? fields.getTextInputValue("delete") : "",
    ];

  if (deleteField === "DELETE" && index >= 0) {
    await interaction.deferUpdate();
    embed.fields.splice(index, 1);
    return await message!.edit(payload(locale, user.id, message.id, embed));
  }

  if (name && value) {
    const field = { name, value, inline };
    if (index >= 0)
      embed.fields[index] = field;
    else embed.fields?.push(field);
  }

  await interaction.deferUpdate();

  const total = embedLength(embed);
  if (total > 6000)
    return await interaction.followUp({
      content: t("embed.over_limit", { e, locale, current: current.currency(), total: total.currency() }),
      ephemeral: true,
    });

  return await message!.edit(payload(locale, user.id, message.id, embed));
}