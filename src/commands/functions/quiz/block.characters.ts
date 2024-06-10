import { APIEmbed, StringSelectMenuInteraction, time } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { QuizCharactersManager } from "../../../structures/quiz";
import { t } from "../../../translator";

export default async function block(
  interaction: StringSelectMenuInteraction,
  userId: string,
  embed: APIEmbed
) {

  await interaction.update({
    content: `${e.Loading} | Bloqueando usuário...`,
    files: [],
    embeds: [],
    components: []
  })
    .catch(() => { });

  const user = await client.getUser(userId);
  if (!user)
    return await interaction.editReply({
      content: `${e.DenyX} | Usuário não encontrado.`
    })
      .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000))
      .catch(() => { });

  await QuizCharactersManager.setBlockedUser(userId, ((1000 * 60) * 60) * 24);
  const character = await QuizCharactersManager.getCharacterFromCache(embed.footer!.text);

  if (character?.channelId)
    await client.channels.send(
      character.channelId,
      t("quiz.characters.you_was_blocked", {
        e,
        locale: await user.locale(),
        authorId: user.id,
        time: time(new Date(Date.now() + ((1000 * 60) * 60) * 24), "F")
      })
    );

  return await interaction.editReply({
    content: `${e.CheckV} | O usuário ${user.username} \`${user.id}\` foi bloqueado por 1 dia de enviar indicações.`
  })
    .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000))
    .catch(() => { });
}