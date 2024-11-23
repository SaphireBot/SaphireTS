import { ButtonInteraction } from "discord.js";
import { GlassGames } from "./GlassesWar";
import { e } from "../../util/json";
import { t } from "../../translator";

export default async function buttonsGlass(
  interaction: ButtonInteraction<"cached">,
  data: {
    c: "glass",
    src: "join" | "leave" | "start" | "cancel" | "dice" | "give" | "remove" | "giveup"
  },
) {

  const { userLocale: locale, channelId } = interaction;
  const game = GlassGames.get(channelId);

  if (!game)
    return await interaction.update({
      content: t("glass.not_found", { e, locale }),
      embeds: [], components: [],
    });

  if (game[data.src])
    return await game[data.src](interaction);

  return await interaction.reply({
    content: "doasodkas#154857441",
  });
}