import { EmbedBuilder, ModalSubmitInteraction, embedLength } from "discord.js";
import payload from "./payload";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function fields(
  interaction: ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, message, user, fields } = interaction;
  if (!message) return;
  let embed = new EmbedBuilder(message!.embeds?.[0]?.toJSON() || {}).data;
  const current = embedLength(embed);
  await interaction.deferUpdate();

  try {
    const json = fields.getTextInputValue("json");
    const data = new EmbedBuilder(JSON.parse(json))?.data;
    embed = data;

    const total = embedLength(embed);
    if (total > 6000)
      return await interaction.followUp({
        content: t("embed.over_limit", { e, locale, current: current.currency(), total: total.currency() }),
        ephemeral: true,
      });

    return await message!.edit(payload(locale, user.id, message.id, embed));
  } catch (err) {
    return await interaction.followUp({
      content: t("embed.error", { e, locale, err }).limit("MessageContent"),
      ephemeral: true,
    });
  }

}