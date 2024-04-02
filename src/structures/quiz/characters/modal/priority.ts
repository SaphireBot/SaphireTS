import { ModalSubmitInteraction, ButtonStyle } from "discord.js";
import { QuizCharactersManager } from "../..";
import { e } from "../../../../util/json";
import Database from "../../../../database";

export default async function priority(interaction: ModalSubmitInteraction<"cached">) {

  const { message, fields } = interaction;
  const field = {} as Record<string, string>;

  for (const { components } of fields.components)
    field[components[0].customId] = components[0].value;

  const embed = message?.embeds?.[0]?.toJSON();
  if (!embed) return await cancel(`${e.DenyX} | Embed não encontrada.`);

  const pathname = embed.footer?.text;
  if (!pathname) return await cancel(`${e.DenyX} | Footer Pathname não encontrado.`);

  const character = await QuizCharactersManager.getCharacterFromCache(pathname);
  if (!character) return await cancel(`${e.DenyX} | Personagem não encontrado no banco de dados cacheado.`);

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

  const data = await Database.CharactersCache.findOneAndUpdate(
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

  if (!data)
    return await cancel(`${e.DenyX} | Não foi possível efetuar a alteração deste personagem.`);

  const gender = {
    male: "Masculino",
    female: "Feminino",
    others: "Outros"
  }[data.gender];

  const category = {
    anime: "Anime",
    movie: "Filme",
    game: "Jogo",
    serie: "Série",
    animation: "Animação",
    hq: "HQ"
  }[data.category];

  embed.description = `Nome: ${data.name}\nObra: ${data.artwork}\nGênero: ${gender}\nCategoria: ${category}`;
  embed.image = {
    url: `attachment://${pathname}`
  };

  return await message.edit({
    embeds: [embed],
    components
  })
    .catch(async () => {
      if (message.id)
        return await QuizCharactersManager.removeFromCacheByMessageId(message.id);
    });

  async function cancel(content: string) {

    if (!message?.id) return await reply();

    if (message.id)
      await QuizCharactersManager.removeFromCacheByMessageId(message.id);

    await reply();
    return setTimeout(async () => await message?.delete()?.catch(() => { }), 3000);

    async function reply() {
      return interaction.deferred
        ? await interaction.editReply({ content })
        : await interaction.reply({ content });
    }
  }
}