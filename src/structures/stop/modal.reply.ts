import { Colors, ModalSubmitInteraction } from "discord.js";
import { games } from "./stop";
import { t } from "../../translator";
import { e } from "../../util/json";

export default async function modalRedirect(
  interaction: ModalSubmitInteraction<"cached">
) {

  const { channelId, userLocale: locale, fields, user } = interaction;
  const game = games.get(channelId!);

  if (!game)
    return await interaction.reply({
      content: t("stop.unknown_game", { e, locale })
    });

  if (game.stop)
    return await interaction.reply({
      content: t("stop.stop_clicked", {
        e,
        locale,
        member: `<@${game.participants.get(game.stop)?.id}>`
      }),
      ephemeral: true
    });

  await interaction.deferUpdate().catch(() => { });

  for await (const comp of fields.components) {
    const field = comp.components[0];
    const { customId: category, value: world } = field;

    const actualWorld = game.categories?.[category]?.get(user.id) || "";
    if (actualWorld === world) continue;

    if (!world.length) {
      game.categories[category].delete(user.id);
      continue;
    }

    if (!world.toLowerCase().startsWith(game.letter)) continue;
    game.categories[category].set(user.id, world);
    continue;
  }

  await interaction.editReply({
    embeds: [{
      color: Colors.Blue,
      title: t("stop.embed.title", locale),
      description: Object.entries(game.categories)
        .map(([cat, opt], i) => {
          const response = opt.get(user.id) || "";
          return `${game.num(i + 1)}. ${t(`stop.category.${cat}`, locale)}: ${response}`;
        })
        .join("\n")
        .limit("EmbedDescription")
    }],
    components: game.replyMessageComponents
  }).catch(() => { });
  return await game.gameRefresh().catch(() => { });
}