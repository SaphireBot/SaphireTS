import { ModalSubmitInteraction, ButtonStyle } from "discord.js";
import { QuizCharactersManager } from "../../..";
import { e } from "../../../../../util/json";
import Database from "../../../../../database";
import client from "../../../../../saphire";
import { t } from "../../../../../translator";

export default async function priority(interaction: ModalSubmitInteraction<"cached">, data: { pathname: string }) {

  const { message, fields, userLocale: locale } = interaction;
  const field = {} as Record<string, string>;

  for (const { components } of fields.components)
    field[components[0].customId] = components[0].value;

  const embed = message?.embeds?.[0]?.toJSON();
  if (!embed) return await cancel(`${e.DenyX} | Embed não encontrada.`);

  const pathname = data.pathname;
  if (!pathname) return await cancel(`${e.DenyX} | Pathname não encontrado.`);

  const character = await QuizCharactersManager.getCharacterByPathname(pathname);
  if (!character) return await cancel(`${e.DenyX} | Personagem não encontrado no banco de dados.`);

  if (!message)
    return await cancel(`${e.DenyX} | Mensagem não encontrada`);

  if (!QuizCharactersManager.categories.includes(field.category))
    return await interaction.reply({
      content: `${e.DenyX} | Categoria indisponível ou ortografia incorreta.\n📑 ${QuizCharactersManager.categories.map(c => `\`${c}\``).join(", ")}`,
      ephemeral: true
    });

  if (!QuizCharactersManager.genders.includes(field.gender))
    return await interaction.reply({
      content: `${e.DenyX} | Gênero indisponível ou ortografia incorreta.\n📑 ${QuizCharactersManager.genders.map(g => `\`${g}\``).join(", ")}`,
      ephemeral: true
    });

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
          }
        ]
      }
    ].asMessageComponents()
  }).catch(() => { });

  const update = await Database.Characters.findOneAndUpdate(
    { pathname },
    {
      $set: {
        name: field["name"] || character.name,
        artwork: field["artwork"] || character.artwork,
        gender: field["gender"] || character.gender,
        category: field["category"] || character.category
      }
    },
    { new: true }
  ).catch(() => null);

  if (!update)
    return await cancel(`${e.DenyX} | Não foi possível efetuar a alteração deste personagem.`);

  QuizCharactersManager.setCharacter(update.toObject());
  const author = await client.users.fetch(update.authorId).catch(() => null);
  embed.description = `${author?.username ? `📨 ${author.username} \`${author.id}\`\n` : ""}👤 ${update.name}\n🎬 ${update.artwork}\n${e.QuizCharacters[update.category as keyof typeof e.QuizCharacters] || "⭐"} ${t(`quiz.characters.names.${update.category}`, locale)}\n${e[update.gender as keyof typeof e] || "❔"} ${t(`quiz.characters.names.${update.gender}`, locale)}\n🆔 \`${update.id}\``;


  return await interaction.editReply({
    embeds: [embed],
    components
  }).catch(() => { });

  async function cancel(content: string) {
    return interaction.deferred
      ? await interaction.editReply({ content })
      : await interaction.reply({ content });
  }
}