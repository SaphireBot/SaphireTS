import { ModalSubmitInteraction, ButtonStyle } from "discord.js";
import { QuizCharactersManager } from "../..";
import { e } from "../../../../util/json";
import Database from "../../../../database";

export default async function answers(interaction: ModalSubmitInteraction<"cached">) {

  const { message, fields } = interaction;
  const answers = fields.getTextInputValue("another_answers") || "";

  const embed = message?.embeds?.[0]?.toJSON();
  if (!embed) return await cancel(`${e.DenyX} | Embed não encontrada.`);

  const pathname = embed.footer?.text;
  if (!pathname) return await cancel(`${e.DenyX} | Footer Pathname não encontrado.`);

  const character = await QuizCharactersManager.getCharacterFromCache(pathname);
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
          }
        ]
      }
    ].asMessageComponents()
  }).catch(() => { });

  const another_answers = (answers?.trim()?.split(",")?.map(str => str.trim()) || []).filter(Boolean);
  const data = await Database.CharactersCache.findOneAndUpdate(
    { pathname },
    {
      $set: { another_answers }
    },
    { new: true }
  ).catch(() => null);

  if (!data)
    return await cancel(`${e.DenyX} | Não foi possível efetuar a alteração deste personagem.`);

  if (!embed.fields) embed.fields = [];
  embed.fields[0].value = data?.another_answers?.map(a => `\`${a}\``)?.join(", ")?.limit("EmbedFieldValue") || "Nenhum outro nome fornecido";
  embed.image = { url: `attachment://${pathname}` };

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