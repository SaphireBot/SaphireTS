import { StringSelectMenuInteraction, MessageFlags } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { FlagQuiz, BrandQuiz, QuizMember } from "../../../structures/quiz";
import edit from "./edit.characters";
import redirectViewer from "./redirect.viewer";
import { checkBeforeIniciate } from "../../slash/games/quiz/index";

export default async function redirect(
  interaction: StringSelectMenuInteraction<"cached">,
  data?: { c: "quiz", uid: string, src?: "edit" | "view" },
) {

  if (!data) return;

  const { userLocale: locale, user, channel } = interaction;

  if (data?.src === "view")
    return await redirectViewer(interaction, data as any);

  if (data?.src === "edit")
    return await edit(interaction, data as any);

  if (data.uid !== user.id)
    return await interaction.reply({
      content: t("quiz.prefix.you_cannot_click_here", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const value = interaction.values[0] as "flags" | "brands" | "characters";

  if (!channel?.id)
    return await interaction.reply({
      content: t("System_noChannelAvailable", { e, locale }),
      flags: ["Ephemeral"], // Correto
    })
      .then(msg => setTimeout(() => msg.delete().catch(() => { }), 4000));

  if (value === "flags")
    return await new FlagQuiz(interaction).checkIfChannelIsUsed();

  if (value === "brands")
    return await new BrandQuiz(interaction).checkIfChannelIsUsed();

  if (value === "characters")
    return await checkBeforeIniciate(interaction);

  if (value === "members")
    return await new QuizMember(interaction).checkIfChannelIsUsed();
}