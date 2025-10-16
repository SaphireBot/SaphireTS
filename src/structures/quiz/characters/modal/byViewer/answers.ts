import { ModalSubmitInteraction, ButtonStyle } from "discord.js";
import { QuizCharactersManager } from "../../..";
import { e } from "../../../../../util/json";
import Database from "../../../../../database";
import { t } from "../../../../../translator";

export default async function answers(interaction: ModalSubmitInteraction<"cached">, data: { pathname: string }) {

  const { message, fields, userLocale: locale } = interaction;
  const answers = fields.getTextInputValue("another_answers") || "";

  const embed = message?.embeds?.[0]?.toJSON();
  if (!embed) return await cancel(`${e.DenyX} | Embed não encontrada.`);

  const pathname = data.pathname;
  if (!pathname) return await cancel(`${e.DenyX} | Footer Pathname não encontrado.`);

  const character = await QuizCharactersManager.getCharacterByPathname(pathname);
  if (!character) return await cancel(`${e.DenyX} | Personagem não encontrado no banco de dados cacheado.`);

  if (!message)
    return await cancel(`${e.DenyX} | Mensagem não encontrada`);

  const components = message.components;
  await interaction.deferUpdate();

  await interaction.editReply({
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Editando...",
            emoji: e.Loading,
            custom_id: "loading",
            style: ButtonStyle.Primary,
            disabled: true,
          },
        ],
      },
    ].asMessageComponents(),
  }).catch(() => { });

  const another_answers = (answers?.trim()?.split(",")?.map(str => str.trim()) || []).filter(Boolean);
  const update = await Database.Characters.findOneAndUpdate(
    { pathname },
    {
      $set: { another_answers },
    },
    { new: true },
  ).catch(() => null);

  if (!update)
    return await cancel(`${e.DenyX} | Não foi possível efetuar a alteração deste personagem.`);

  QuizCharactersManager.setCharacter(update.toObject());
  if (!embed.fields) embed.fields = [];
  const value = update?.another_answers?.map(a => `\`${a}\``)?.join(", ")?.limit("EmbedFieldValue") || "Nenhum outro nome fornecido";

  if (another_answers.length) {
    const field = embed.fields!.find(field => field.name.startsWith("📑"));
    if (field) field.value = value;
    else embed.fields.push({
      name: t("quiz.characters.viewer.embed.alternative_answers", locale),
      value,
    });
  } else {
    embed.fields = embed.fields.filter(field => !field.name.startsWith("📑"));
  }

  return await interaction.editReply({
    embeds: [embed],
    components,
  })
    .catch(() => { });

  async function cancel(content: string) {
    return interaction.deferred
      ? await interaction.editReply({ content })
      : await interaction.reply({ content });
  }
}