import { AutocompleteInteraction } from "discord.js";
import { getLocalizations } from "../../../util/getlocalizations";
import { QuizCharactersManager } from "../../quiz";
import { t } from "../../../translator";

const choices = [
  {
    name: "My points",
    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.0"),
    value: "points"
  },
  {
    name: "[ADMIN ONLY] Transfer characters to principal Database",
    name_localizations: getLocalizations("quiz.options.2.options.1.options.0.choices.1"),
    value: "transfer"
  }
];

export default async function quizOptions(interaction: AutocompleteInteraction, value: string, name: "function" | "character") {

  if (name === "function")
    return await interaction.respond(choices.filter(v => v.name.includes(value?.toLowerCase() || "")));

  if (name === "character") {
    const characters = QuizCharactersManager.characters.toJSON();
    const v = (value || "").toLowerCase();

    if (!v)
      return await interaction.respond(characters.slice(0, 25)
        ?.map(ch => ({
          name: `${t(`quiz.characters.names.${ch.category}`)} | ${t(`quiz.characters.names.${ch.gender}`)} | ${ch.name} | [${ch.artwork}]`.limit("ApplicationCommandChoiceName"),
          value: ch.pathname.limit("ApplicationCommandChoiceValue")
        })));

    const fill = characters
      .filter(ch => {

        const arr = Object.entries(ch)
          .map(([k, v]) => {

            const str = [] as string[];

            if (k === "another_answers")
              str.push(...(v as string[]));

            if (typeof v === "string") str.push(v);
            str.push(
              ...Object.values(value).flat().filter(str => typeof str === "string")
            );

            return str;
          })
          .flat();

        return arr.some(str => str?.includes(v));

      });

    return await interaction.respond(
      fill
        .slice(0, 25)
        ?.map(ch => ({
          name: `${t(`quiz.characters.names.${ch.category}`)} | ${t(`quiz.characters.names.${ch.gender}`)} | ${ch.name} | [${ch.artwork}]`.limit("ApplicationCommandChoiceName"),
          value: ch.pathname.limit("ApplicationCommandChoiceValue")
        }))
    );
  }

}