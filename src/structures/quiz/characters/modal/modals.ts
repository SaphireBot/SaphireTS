import { ModalSubmitInteraction } from "discord.js";
import priority from "./priority";
import { QuizCharactersManager } from "../..";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import answers from "./answers";
import languages from "./languages";

export default async function modals(interaction: ModalSubmitInteraction<"cached">, data: { c: "quiz", src: "edit", id: "priority" | "answers" | "langs" }) {

  const { userLocale: locale, user } = interaction;

  if (!QuizCharactersManager.staff.includes(user.id))
    return await interaction.reply({
      content: t("quiz.characters.you_cannot_use_this_command", { e, locale }),
      ephemeral: true
    });

  if (data?.id === "priority")
    return await priority(interaction);

  if (data?.id === "answers")
    return await answers(interaction);
  
  if (data?.id === "langs")
    return await languages(interaction);
}