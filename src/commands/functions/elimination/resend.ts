import { ButtonInteraction, ButtonStyle, parseEmoji } from "discord.js";
import Database from "../../../database";
import { EliminationCache } from "../../../@types/commands";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { mapButtons } from "djs-protofy";

export default async function resend(
  interaction: ButtonInteraction<"cached">
) {

  const { guild, userLocale, message, guildId, channelId, user, channel } = interaction;
  const locale = guild.preferredLocale || userLocale || client.defaultLocale;
  const game = await Database.Games.get(`Elimination.${guildId}.${channelId}.${message.id}`) as EliminationCache;

  if (!game) {
    await Database.Games.delete(`Elimination.${guildId}.${channelId}.${message.id}`);
    return await interaction.update({
      content: t("crash.game_not_found", { e, locale }),
      embeds: [],
      components: []
    }).catch(() => { });
  }

  if (!game.players[user.id])
    return await interaction.deferUpdate().catch(() => { });

  const primaryComponents = message.components;

  const components = mapButtons(message.components, (button, rowIndex, buttonIndex) => {
    if (!("custom_id" in button)) return button;

    button.disabled = true;

    if (rowIndex !== 4) {
      button.emoji = parseEmoji("⬇️")!;
      button.label = undefined;
    }

    if (rowIndex === 4 && buttonIndex === 1)
      button.emoji = parseEmoji(e.Loading)!;

    return button;
  });

  await interaction.update({ components });
  await sleep(2000);

  await message.delete().catch(() => { });

  const msg = await channel!.send({
    embeds: [game.embed],
    components: primaryComponents
  })
    .catch(() => undefined);

  if (!msg) return;
  await Database.Games.set(`Elimination.${guildId}.${channelId}.${msg.id}`, game);
  return;
}