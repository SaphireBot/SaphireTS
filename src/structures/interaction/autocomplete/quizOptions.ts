import { AutocompleteInteraction } from "discord.js";
import { QuizCharactersManager } from "../../quiz";
import { t } from "../../../translator";

export default async function quizOptions(interaction: AutocompleteInteraction, value: string, name: "characters" | "artwork") {

  const characters = QuizCharactersManager.characters.toJSON();
  const v = (value || "").toLowerCase();

  if (name === "characters") {

    const queries: string[] = v?.split(",") || [];

    if (!queries?.length)
      return await interaction.respond(characters.slice(0, 25)
        ?.map(ch => ({
          name: `${t(`quiz.characters.names.${ch.category}`)} | ${t(`quiz.characters.names.${ch.gender}`)} | ${ch.name} | ${ch.artwork}`.limit("ApplicationCommandChoiceName"),
          value: ch.pathname.limit("ApplicationCommandChoiceValue")
        })));

    const fill = characters
      .filter(ch => ch.autocompleteSearch?.some(str => str?.includes(v)));

    return await interaction.respond(
      fill
        .slice(0, 25)
        ?.map(ch => ({
          name: `${t(`quiz.characters.names.${ch.category}`)} | ${t(`quiz.characters.names.${ch.gender}`)} | ${ch.name} | ${ch.artwork}`.limit("ApplicationCommandChoiceName"),
          value: ch.pathname.limit("ApplicationCommandChoiceValue")
        }))
    );
  }

  if (name === "artwork") {
    const artworks = Array.from(QuizCharactersManager.artworks);

    const data = artworks
      .filter(artwork => artwork.toLowerCase()?.includes(v))
      .slice(0, 25)
      .map(str => ({
        name: str.limit("ApplicationCommandChoiceName"),
        value: str.limit("ApplicationCommandChoiceName")
      }));

    return await interaction.respond(data);
  }

}