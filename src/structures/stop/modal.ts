import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { games } from "./stop";
import { t } from "../../translator";
import { e } from "../../util/json";
import Database from "../../database";
import reply from "./modal.reply";

export default async function modalRedirect(
  interaction: ModalSubmitInteraction<"cached">,
  customData: { src: "categories" | "custom_categories" | "reply" },
) {
  
  if (customData.src === "reply")
    return await reply(interaction);

  const { channelId, userLocale: locale, fields, user, message } = interaction;
  const game = games.get(channelId!);

  if (!game)
    return await interaction.reply({
      content: t("stop.unknown_game", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  if (user.id !== game.author.id)
    return await interaction.reply({
      content: t("stop.you_cannot_click_here", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const text = fields.getTextInputValue("categories") || "";
  if (!text.includes(","))
    return await interaction.reply({
      content: t("stop.where_is_the_comma", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const categories = text.trim().split(/\s*,\s*/g);
  game.categories = {};
  for (const cat of categories)
    if (cat.length)
      game.categories[cat] = new Map();

  const embed = game.embed;
  embed.description = Object.keys(game.categories).map(cat => `${t(`stop.category.${cat}`, locale)}`).join("\n");

  embed.description += `\n \n${t("stop.awaiting_categories", { e, locale })}`;
  if (game.collector) game.collector.resetTimer({ idle: (1000 * 60) * 2 });
  await interaction.deferUpdate();
  await message!.edit({ embeds: [embed], components: game.chooseComponents });

  if (customData?.src === "custom_categories")
    await Database.Users.updateOne(
      { id: user.id },
      {
        $set: { "Stop.categories": Object.keys(game.categories) },
      },
    );

  return;
}