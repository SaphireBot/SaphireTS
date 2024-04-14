import { APIEmbed, ChatInputCommandInteraction, Collection, ComponentType, Message } from "discord.js";
import { QuizCharactersManager } from "../../../../../structures/quiz";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import { Character } from "../../../../../@types/quiz";
import { ButtonInteraction } from "discord.js";
import buildEmbed from "./embed.characters";

export default async function view(
  interaction: ChatInputCommandInteraction | Message
) {

  const { userLocale: locale } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;

  let characters = new Collection<string, Character>();

  const msg = await interaction.reply({
    content: t("quiz.characters.viewer.searching_characters", { e, locale }),
    fetchReply: true
  });

  if (interaction instanceof ChatInputCommandInteraction) {
    const queries = interaction.options.getString("characters", true)?.split(",");
    characters = await QuizCharactersManager.search(queries);
  }

  if (interaction instanceof Message)
    characters = await QuizCharactersManager.search(interaction.content.split(","));

  if (!characters.size)
    return await edit({
      content: t("quiz.characters.viewer.no_query", { e, locale })
    }).catch(() => { });

  await edit({
    content: t("quiz.characters.viewer.building", { e, locale, size: characters.size })
  }).catch(() => { });

  const data: Record<number, { embeds: APIEmbed[], components: any[], files: any[] }> = {};
  let pages = 0;
  await EmbedGenerator();

  await edit({
    content: null,
    embeds: data[0].embeds,
    files: data[0].files,
    components: pages > 1
      ? data[0].components
      : [(data[0].components as any)[0]].filter(Boolean) as any[]
  });

  if (pages <= 1) return;
  let i = 0;
  return msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 5,
    componentType: ComponentType.Button
  })
    .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

      const { customId } = int;

      if (customId === "zero") i = 0;
      if (customId === "preview") i = i <= 0 ? pages - 1 : i - 1;
      if (customId === "next") i = i >= (pages - 1) ? 0 : i + 1;
      if (customId === "last") i = pages - 1;

      return await int.update(data[i]).catch(() => { });
    })
    .on("end", async (): Promise<any> => {
      return await msg.edit({ components: [] }).catch(() => { });
    });

  async function EmbedGenerator() {
    for await (const character of characters.values()) {
      const res = await buildEmbed(character, user.id, locale);
      res.embeds[0].title += ` - ${pages + 1}/${characters.size}`;
      data[pages] = res;
      pages++;
    }
  }

  async function edit(payload: any) {
    if (interaction instanceof ChatInputCommandInteraction)
      return await interaction.editReply(payload);

    return msg.edit(payload);
  }

}