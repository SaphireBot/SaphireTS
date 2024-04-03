import { ModalSubmitInteraction } from "discord.js";
import { QuizCharactersManager } from "../..";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import answers from "./answers";
import languages from "./languages";
import priority from "./priority";
import answersViewer from "./byViewer/answers";
import languagesViewer from "./byViewer/languages";
import priorityViewer from "./byViewer/priority";
import unblock from "./unblock";

export default async function modals(
  interaction: ModalSubmitInteraction<"cached">,
  data: {
    c: "quiz",
    src: "edit" | "unblockUser",
    id?: "priority" | "answers" | "langs",
    pathname: string
  }
) {

  const { userLocale: locale, user } = interaction;

  if (!QuizCharactersManager.staff.includes(user.id))
    return await interaction.reply({
      content: t("quiz.characters.you_cannot_use_this_command", { e, locale }),
      ephemeral: true
    });

  if (data?.pathname?.length) {
    if (data?.id === "priority")
      return await priorityViewer(interaction, data);

    if (data?.id === "answers")
      return await answersViewer(interaction, data);

    if (data?.id === "langs")
      return await languagesViewer(interaction, data);
  }

  if (data?.src === "unblockUser")
    return await unblock(interaction);

  if (data?.id === "priority")
    return await priority(interaction);

  if (data?.id === "answers")
    return await answers(interaction);

  if (data?.id === "langs")
    return await languages(interaction);
}