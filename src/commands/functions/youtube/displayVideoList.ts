import { ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { YouTubeVideoResponse } from "../../../@types/youtube";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import buttonPagination from "./buttons.pagination";

export default async function displayVideoList(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  items: YouTubeVideoResponse[]
) {

  if (!Array.isArray(items)) items = [];

  const { userLocale: locale, user } = interaction;

  if (!items.length)
    return await interaction.editReply({
      content: t("youtube.no_response_items", { e, locale })
    });

  if (items.length > 25) items.length = 25;

  const urls = items
    .map((item) => `https://www.youtube.com/watch?v=${item.id.videoId}`.limit("MessageContent"));

  const selectMenu = {
    type: 1,
    components: [{
      type: 3,
      custom_id: "youtube",
      placeholder: t("youtube.components.video.select_menu.placeholder", locale),
      options: items.map((item, index) => ({
        label: item.snippet.title.limit("SelectMenuLabel"),
        emoji: e.youtube,
        description: item.snippet.description.limit("SelectMenuLabel"),
        value: `${index}`,
      }))
    }]
  };

  const msg = await interaction.editReply({
    content: urls[0],
    components: [
      selectMenu,
      buttonPagination(0, urls.length)
    ]
  });

  const collector = msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 15
  });

  let index = 0;
  collector.on("collect", async (int: ButtonInteraction | StringSelectMenuInteraction): Promise<any> => {

    if (int instanceof ButtonInteraction) {
      const customId = int.customId;
      if (customId === "zero") index = 0;
      if (customId === "preview") index = index > 0 ? index - 1 : urls.length - 1;
      if (customId === "next") index = index >= (urls.length - 1) ? 0 : index + 1;
      if (customId === "last") index = urls.length - 1;
      if (customId === "cancel") return collector.stop();
    } else index = Number(int.values[0]);

    return await int.update({
      content: urls[index],
      components: [
        selectMenu,
        buttonPagination(index, urls.length)
      ]
    });
  });

  collector.on("end", async (): Promise<any> => await msg.edit({ components: [] }));
  return;
}