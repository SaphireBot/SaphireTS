import { ComponentType, StringSelectMenuInteraction } from "discord.js";
import { QuizCharactersManager } from "../../../structures/quiz";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import modals from "../../../structures/modals";
import block from "./block.characters";
import { Character } from "../../../@types/quiz";

export default async function edit(
  interaction: StringSelectMenuInteraction,
  data: {
    c?: "quiz",
    src?: "edit",
    id?: string,
    pathname?: string,
    character?: Character
  }
) {

  const { message, user, userLocale: locale, values } = interaction;
  const embed = message.embeds?.[0]?.data;
  const pathname = data?.pathname || embed?.footer?.text;

  if (!QuizCharactersManager.staff.includes(user.id))
    return await interaction.reply({
      content: t("quiz.characters.staff_only", { e, locale }),
      ephemeral: true
    });

  if (!pathname) {
    QuizCharactersManager.removeFromCache([message.id]);
    await message.delete().catch(() => { });
    return await interaction.reply({
      content: `${e.DenyX} | Embed não encontrada.`
    });
  }

  const character = data.character
    || await QuizCharactersManager.getCharacterByPathname(pathname)
    || await QuizCharactersManager.getCharacterFromCache(pathname);

  if (!character) {
    QuizCharactersManager.removeFromCache([message.id]);
    await message.delete().catch(() => { });
    return await interaction.reply({
      content: `${e.DenyX} | Personagem não encontrado.`
    });
  }

  if (data.id === "langs") {
    const data = values.map((v, i) => {
      const [lang, key] = v.split("|");
      return [
        key,
        `${lang}.${key}.${i}`,
        (character as any)?.[key.includes("artwork") ? "artworkLocalizations" : "nameLocalizations"]?.[lang] as any
      ];
    }) as [string, string, string | undefined][];
    return await interaction.showModal(
      modals.characterEditLanguage(data, embed?.footer?.text?.includes("cdn.") ? pathname : "")
    );
  }

  const value = (data.id || values[0]) as "base_data" | "another_answers" | "language" | "block.userId";

  if (value.includes("block"))
    return await block(interaction, value.split(".")[1], embed);

  if (value === "language") {
    const secondComponent = message.components.at(-1)?.components[0]?.type === ComponentType.StringSelect
      ? null
      : message.components.at(-2)?.toJSON();

    return await interaction.update({
      components: [
        {
          type: 1,
          components: [{
            type: 3,
            custom_id: JSON.stringify({ c: "quiz", src: "edit", id: "langs", pathname: data.pathname }),
            placeholder: "Selecione a opção de tradução",
            options: QuizCharactersManager.buildTranslateSelectMenu(character),
            max_values: 5,
            min_values: 1
          }]
        },
        secondComponent,
        message.components.at(-1)!.toJSON()
      ]
        .filter(Boolean)
        .asMessageComponents()
    });
  }

  if (message.components.length === 3)
    message.components.shift();
  await message.edit({ components: message.components }).catch(() => { });

  if (value === "base_data") {
    character.pathname = "";
    return await interaction.showModal(
      modals.characterEditPrincipalData(character)
    );
  }

  if (value === "another_answers")
    return await interaction.showModal(
      modals.characterEditAnotherAnswers(character.another_answers)
    );

}