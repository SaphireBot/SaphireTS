import { ButtonInteraction } from "discord.js";
import { games } from "./stop";
import { t } from "../../translator";
import { e } from "../../util/json";
import modals from "../modals";

export default async function reply(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "stop", src: "reply" | "table", id: "0.5" }
) {

  const { user, channelId, userLocale: locale } = interaction;
  const game = games.get(channelId);

  if (!game)
    return await interaction.update({
      content: t("stop.unknown_game", { e, locale }),
      embeds: [],
      components: []
    });

  if (customData?.src === "table")
    return await game.table(interaction);

  if (customData?.src === "reply") {
    const [init, last] = customData.id.split(".").map(i => Number(i));
    const worlds: string[] = [];

    for (let i = init; i < last; i++)
      worlds.push(game.control.categoryID[i]);

    return await interaction.showModal(
      modals.replyStopCategories(
        worlds,
        locale,
        game,
        user.id,
        game.letter
      )
    );
  }

}