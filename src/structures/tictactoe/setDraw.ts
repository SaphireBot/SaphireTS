import { ButtonInteraction, ButtonStyle, parseEmoji } from "discord.js";
import { TicTacToeDataGame } from "../../@types/commands";
import { e } from "../../util/json";
import { t } from "../../translator";
import Database from "../../database";
import { mapButtons } from "djs-protofy";

export default async function setDraw(
  interaction: ButtonInteraction<"cached">,
  game: TicTacToeDataGame,
) {

  const { userLocale: locale, guildId, channelId, message } = interaction;

  const components = mapButtons(message.components, button => {
    if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;
    button.disabled = true;
    return button;
  })
    .map(bt => bt.toJSON());

  components.push({
    type: 1,
    components: [
      {
        type: 2,
        label: t("tictactoe.again", locale),
        custom_id: JSON.stringify({ c: "tictactoe", src: "again", id: game.author, id2: game.opponent }),
        emoji: parseEmoji("👵")!,
        style: ButtonStyle.Primary,
      },
    ],
  });

  await interaction.update({
    content: t("tictactoe.draw", { e, locale, author: game.author, opponent: game.opponent }),
    components,
  });
  await Database.Games.delete(`Tictactoe.${guildId}.${channelId}.${message.id}`);

  await Database.Users.updateOne(
    { id: game.author },
    { $inc: { "Jokempo.Draws": 1 } },
    { upsert: true },
  );

  await Database.Users.updateOne(
    { id: game.opponent },
    { $inc: { "Jokempo.Draws": 1 } },
    { upsert: true },
  );
  return;
}