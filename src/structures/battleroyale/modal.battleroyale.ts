import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import reviewModel from "./review.modal";

export default async function battleroyaleModal(
  interaction: ModalSubmitInteraction<"cached">,
  data: { c: "battleroyale", src: "phrase" | "review" },
) {

  if (data.src === "review")
    return await reviewModel(interaction);

  const { userLocale: locale, fields, user } = interaction;
  const phrase = fields.getTextInputValue("phrase");

  const success = new Database.BattleroyalePhrases({
    approved: false,
    phrase,
    user: user.id,
    kill: undefined,
  })
    .save()
    .catch(() => null);

  if (!success)
    return await interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t("battleroyale.error_to_send", { e, locale, phrase }),
    });

  return await interaction.reply({
    flags: [MessageFlags.Ephemeral],
    content: t("battleroyale.are_you_regretted", { e, locale, phrase }),
  });
}