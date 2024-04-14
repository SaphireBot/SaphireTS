import { ChatInputCommandInteraction, Colors, Message } from "discord.js";
import { QuizCharactersManager } from "../../../../../structures/quiz";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";

export default async function status(
  interaction: ChatInputCommandInteraction | Message
) {

  const { userLocale: locale } = interaction;
  const characters = QuizCharactersManager.characters;

  const data = {
    total: characters.size,
    categories: QuizCharactersManager.categories,
    users: QuizCharactersManager.usersThatSendCharacters,
    artworks: QuizCharactersManager.artworks.size,
    usersBlockeds: QuizCharactersManager.blockedTimeouts.size,
    animes: characters.filter(ch => ch.category === "anime").size,
    movie: characters.filter(ch => ch.category === "movie").size,
    game: characters.filter(ch => ch.category === "game").size,
    serie: characters.filter(ch => ch.category === "serie").size,
    animation: characters.filter(ch => ch.category === "animation").size,
    hq: characters.filter(ch => ch.category === "hq").size,
    kdrama: characters.filter(ch => ch.category === "k-drama").size
  };

  return await interaction.reply({
    embeds: [{
      color: Colors.Blue,
      title: t("quiz.status.title", locale),
      description: t("quiz.status.description", {
        e,
        locale
      }),
      fields: [
        {
          name: t("quiz.status.fields.0", locale),
          value: t("quiz.status.value", { locale, data })
        }
      ]
    }]
  });

}