import { ButtonInteraction, ButtonStyle, MessageFlags, parseEmoji } from "discord.js";
import Database from "../../database";
import { TicTacToeDataGame } from "../../@types/commands";
import { t } from "../../translator";
import { e } from "../../util/json";
import { mapButtons } from "djs-protofy";
import client from "../../saphire";
import isWinTictactoe from "./isWin";
import setWinTictactoe from "./setWin";
import setDraw from "./setDraw";
import Tictactoe from "./tictactoe";

export default async function TictactoePlay(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "tictactoe", src?: "again", id: "string", id2?: string },
) {

  const { user, userLocale: locale, guildId, channelId, message, customId } = interaction;

  if (customData?.src === "again") {
    if (![customData?.id, customData?.id2].includes(user.id))
      return await interaction.reply({
        content: t("tictactoe.you_arent_player", { e, locale }),
        flags: [MessageFlags.Ephemeral],
      });

    const components = mapButtons(message.components, button => {
      if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;
      button.disabled = true;
      return button;
    });

    await message.edit({ components });
    return new Tictactoe(interaction);
  }

  if (message.partial) await message.fetch()?.catch(() => { });

  const game: TicTacToeDataGame | null = await Database.Games.get(`Tictactoe.${guildId}.${channelId}.${message.id}`);
  if (!game || !game?.players?.length) return await message.delete().catch(() => { });

  if (!game.players.includes(user.id))
    return await interaction.reply({
      content: t("tictactoe.you_arent_player", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  if (user.id !== game.whoPlayNow)
    return await interaction.reply({
      content: t("tictactoe.not_your_time", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const state: Record<string, string> = {};

  let draw = 0;
  const components = mapButtons(message.components, button => {
    if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;

    if (button.custom_id === customId) {
      button.disabled = true;
      button.emoji = parseEmoji(game.emoji[user.id])!;
    }

    const parse = JSON.parse(button.custom_id) as { c: "tictactoe", id: string };
    state[parse.id] = button.emoji?.name || "▪️";
    if (button.disabled) draw++;
    return button;
  });

  const whoPlayNow = game.whoPlayNow === game.author ? game.opponent : game.author;
  const otherPlayer = await client.users.fetch(whoPlayNow).catch(() => null);

  if (!otherPlayer?.id) return await message.delete()?.catch(() => { });

  if (draw === 9) {
    (interaction.message as any).components = components;
    return await setDraw(interaction, game);
  }

  if (isWinTictactoe(state, game.emoji[user.id])) {
    (interaction.message as any).components = components;
    return await setWinTictactoe(interaction, otherPlayer);
  }

  const success = await interaction.update({
    content: t("tictactoe.playNow", { e, locale: await otherPlayer.locale(), whoWillPlayNow: whoPlayNow, emoji: game.emoji[otherPlayer.id] }),
    components,
  }).catch(() => null);
  if (!success) return await message.delete()?.catch(() => { });

  await Database.Games.set(`Tictactoe.${guildId}.${channelId}.${message.id}.whoPlayNow`, whoPlayNow);
  return;
}