import { StringSelectMenuInteraction } from "discord.js";
import { QuizCharactersManager } from "../../../structures/quiz";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import edit from "./edit.characters";
import modals from "../../../structures/modals";
import buildEmbed from "../../slash/games/quiz/characters/embed.characters";
import Database from "../../../database";
import client from "../../../saphire";
import { Config } from "../../../util/constants";

export default async function redirectViewer(
  interaction: StringSelectMenuInteraction,
  data?: { c: "quiz"; src: "view"; path: string; }
) {

  if (!data?.path)
    return await interaction.message.delete().catch(() => { });

  const character = await QuizCharactersManager.getCharacterByPathname(data.path);
  const { userLocale: locale, values, user } = interaction;

  const value = values[0] as "base_data" | "another_answers" | "language" | "delete" | "report" | "refresh";

  if (value === "refresh") {

    const character = (await QuizCharactersManager.search([data.path])).first();

    if (!character)
      return await interaction.update({
        content: t("quiz.characters.viewer.no_query", { e, locale }),
        components: [],
        embeds: []
      });

    const title = interaction.message?.embeds?.[0]?.title;
    const { embeds, files } = await buildEmbed(character, user.id, locale);
    embeds[0].title = title || embeds[0].title;

    return await interaction.update({
      embeds: [embeds[0]],
      files
    }).catch(() => { });
  }

  if (!character)
    return await interaction.update({
      content: t("quiz.characters.viewer.no_query", { e, locale }),
      components: [],
      embeds: []
    });

  if (value === "delete") {
    if (!QuizCharactersManager.isStaff(user.id))
      return await interaction.message.delete().catch(() => { });

    await interaction.update({
      content: t("quiz.characters.viewer.removing", { e, locale }),
      embeds: [], components: []
    });

    QuizCharactersManager.characters.delete(character.id);
    await Database.Characters.deleteOne({ pathname: data.path });
    const content = `${e.Info} | CDN | A imagem \`${data.path}\` foi removida do quiz de personagem.`;
    await client.users.send(Config.ownerId, { content })
      .catch(() => console.log(content));
    
    return await interaction.editReply({
      content: t("quiz.characters.viewer.removed", { e, locale, id: character.id })
    });
  }

  if (["base_data", "another_answers", "language", "delete"].includes(value)
    && !QuizCharactersManager.isStaff(user.id))
    return await interaction.update({
      content: t("quiz.characters.you_cannot_use_this_command", { e, locale }),
      embeds: [], components: []
    });

  if (value === "base_data")
    return await interaction.showModal(
      modals.characterEditPrincipalData(character)
    );

  if (value === "another_answers")
    return await interaction.showModal(
      modals.characterEditAnotherAnswers(character.another_answers, character.pathname)
    );

  if (value === "language")
    return await edit(
      interaction,
      {
        id: value,
        pathname: character.pathname,
        character
      }
    );
}
