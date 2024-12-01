import { ButtonInteraction, ButtonStyle, parseEmoji, User } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import { mapButtons } from "djs-protofy";

export default async function setWinTictactoe(interaction: ButtonInteraction<"cached">, loser: User) {

  const { user, userLocale: locale, guildId, channelId, message } = interaction;

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
        custom_id: JSON.stringify({ c: "tictactoe", src: "again", id: user.id, id2: loser.id }),
        emoji: parseEmoji("👵")!,
        style: ButtonStyle.Primary,
      },
    ],
  });

  await interaction.update({
    content: t("tictactoe.win", { e, locale, winner: user, loser }),
    components,
  });

  await Database.Games.delete(`Tictactoe.${guildId}.${channelId}.${message.id}`);

  await Database.Users.updateOne(
    { id: user.id },
    { $inc: { "Jokempo.Wins": 1 } },
    { upsert: true },
  );

  await Database.Users.updateOne(
    { id: loser.id },
    { $inc: { "Jokempo.Loses": 1 } },
    { upsert: true },
  );
  return;
}