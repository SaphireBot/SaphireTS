import { APIEmbedField, ModalSubmitInteraction } from "discord.js";
import { QuizCharactersManager } from "../../..";
import { e } from "../../../../../util/json";
import Database from "../../../../../database";
import { Config } from "../../../../../util/constants";
import { Character, LocalizationsKeys } from "../../../../../@types/quiz";
import { t } from "../../../../../translator";

export default async function languages(interaction: ModalSubmitInteraction<"cached">, options: { pathname: string }) {

  const { fields, message, userLocale: locale } = interaction;
  if (!message)
    return await cancel(`${e.DenyX} | Mensagem não encontrada`);

  const data = {
    artworkLocalizations: {} as Record<string, string | undefined>,
    nameLocalizations: {} as Record<string, string | undefined>
  };

  for (const { components } of fields.components) {
    const { customId, value } = components[0];
    const [locale, artworkOrName] = customId.split(".");
    data[artworkOrName.includes("artwork") ? "artworkLocalizations" : "nameLocalizations"][locale] = ((value === "NO_NAME_VALUE") || !value) ? undefined : value;
  }

  const embed = message?.embeds?.[0]?.toJSON();
  if (!embed) return await cancel(`${e.DenyX} | Embed não encontrada.`);

  const pathname = options.pathname;
  if (!pathname) return await cancel(`${e.DenyX} | Footer Pathname não encontrado.`);

  const character = await QuizCharactersManager.getCharacterByPathname(pathname);
  if (!character) return await cancel(`${e.DenyX} | Personagem não encontrado no banco de dados cacheado.`);

  await interaction.deferUpdate();

  const names = Object.keys(data.nameLocalizations);
  const artworks = Object.keys(data.artworkLocalizations);
  const $set = {} as Record<string, string>;
  const $unset = {} as Record<string, true>;

  if (names.length)
    for (const name of names)
      if (typeof data.nameLocalizations[name] === "string")
        $set[`nameLocalizations.${name}`] = data.nameLocalizations[name]!;
      else $unset[`nameLocalizations.${name}`] = true;

  if (artworks.length)
    for (const art of artworks)
      if (typeof data.artworkLocalizations[art] === "string")
        $set[`artworkLocalizations.${art}`] = data.artworkLocalizations[art]!;
      else $unset[`artworkLocalizations.${art}`] = true;

  const update = await Database.Characters.findOneAndUpdate(
    { pathname },
    { $set, $unset },
    { new: true }
  ).then(obj => obj?.toObject())
    .catch(() => null) as Character | null;

  if (!update)
    return await cancel(`${e.DenyX} | Não foi possível efetuar a alteração deste personagem.`);

  QuizCharactersManager.setCharacter(update);
  const embedFields: APIEmbedField[] = (embed.fields || []).filter(field => !field.name.startsWith(e.Translate));

  embedFields.unshift({
    name: t("quiz.characters.viewer.embed.nameLocalizations", { e, locale }),
    value: Object.entries(update?.nameLocalizations || [])
      .map(([locale, value]) => {
        if (!value) return;
        return `${Config.flagLocales[locale as LocalizationsKeys]} ${value}`;
      })
      .filter(Boolean)
      .join("\n") || "Nenhum nome informado"
  });

  embedFields.unshift({
    name: t("quiz.characters.viewer.embed.artworkLocalizations", { e, locale }),
    value: Object.entries(update?.artworkLocalizations || [])
      .map(([locale, value]) => {
        if (!value) return;
        return `${Config.flagLocales[locale as LocalizationsKeys]} ${value}`;
      })
      .filter(Boolean)
      .join("\n") || "Nenhum nome informado"
  });

  embed.fields = embedFields;

  return await interaction.editReply({
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "quiz", src: "edit", id: "langs", pathname }),
          placeholder: "Selecione a opção de tradução",
          options: QuizCharactersManager.buildTranslateSelectMenu(update),
          max_values: 5,
          min_values: 1
        }]
      },
      message.components.at(-1)!.toJSON()
    ]
  })
    .catch(() => { });

  async function cancel(content: string) {
    return interaction.deferred
      ? await interaction.editReply({ content })
      : await interaction.reply({ content });
  }

}