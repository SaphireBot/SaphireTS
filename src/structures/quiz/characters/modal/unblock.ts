import { ModalSubmitInteraction } from "discord.js";
import { QuizCharactersManager } from "../..";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function unblock(interaction: ModalSubmitInteraction<"cached">) {

  const { userLocale: locale, user, fields } = interaction;

  if (!QuizCharactersManager.staff.includes(user.id))
    return await interaction.reply({
      content: t("quiz.characters.you_cannot_use_this_command", { e, locale })
    });

  const userId = fields.getTextInputValue("userId");
  const userIdBlocked = await QuizCharactersManager.isBlockedUser(userId);

  if (!userIdBlocked)
    return await interaction.reply({
      content: t("quiz.characters.user_not_blocked", { e, locale })
    });

  await QuizCharactersManager.removeBlockedUser(userId);
  return await interaction.reply({
    content: t("quiz.characters.user_unblocked", { e, locale })
  });
}