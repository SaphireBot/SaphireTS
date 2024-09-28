import { ButtonInteraction, ButtonStyle } from "discord.js";
import Database from "../../../database";
import { EliminationCache } from "../../../@types/commands";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { mapButtons } from "djs-protofy";
import resend from "./resend";
type customIdParse = {
  c: "elimination"
  src: "click" | "my_number" | "refresh"
  id: string
  num: number
  i: number
};

export default async function eliminationClick(
  interaction: ButtonInteraction<"cached">,
  customIdData: customIdParse
) {

  const { guild, userLocale, message, guildId, channelId, user } = interaction;
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

  if (customIdData.src === "refresh") return await resend(interaction);

  if (customIdData.src === "my_number")
    return await interaction.reply({
      content: t("elimination.my_number", {
        e,
        locale,
        number: game.players[user.id] || "??"
      }),
      ephemeral: true
    });

  if (game.playSequency[game.playNowIndex] !== user.id)
    return await interaction.deferUpdate().catch(() => { });

  if (!game.clicks?.length)
    game.clicks = [];

  const targetId = Object.entries(game.players)
    .find(([_, num]) => num === customIdData.i)?.[0];

  game.clicks.push(customIdData.i);
  if (targetId) {
    game.embed.fields = [{
      name: t("elimination.embed.fields.0.name_turned", { e, locale }),
      value: t("elimination.eliminated", { locale, id: targetId, user })
    }];

    game.eliminated[targetId] = customIdData.i;
    const playSequency: Record<number, string> = {};

    let i = 0;
    for (const userId of Object.keys(game.players)) {
      if (game.eliminated[userId]) continue;
      playSequency[i] = userId;
      i++;
    }

    game.playSequency = playSequency;

    game.embed.description = Object.entries(game.players)
      .map(([userId, num]) => `${game.eliminated[userId] ? `☠️ \`${num}\`` : "🔹"} <@${userId}>`)
      .join("\n") || t("elimination.embed.no_member", { e, locale });

  } else {
    game.embed.fields = [{
      name: t("elimination.embed.fields.0.name_turned", { e, locale }),
      value: t("elimination.eliminated_nobody", { locale, user })
    }];
  }

  game.playNowIndex = game.playNowIndex + 1;

  if (game.playNowIndex >= Object.keys(game.playSequency).length)
    game.playNowIndex = 0;

  await interaction.update({
    embeds: [game.embed],
    components: mapButtons(message.components, button => {
      if (!("custom_id" in button)) return button;

      const customId = JSON.parse(button.custom_id) as customIdParse;

      if (game.clicks.includes(customId.i))
        button.style = ButtonStyle.Danger;

      button.disabled = true;
      return button;
    })
  });

  await sleep(2500);

  let components = mapButtons(message.components, button => {
    if (button.style !== ButtonStyle.Danger) button.disabled = false;
    return button;
  });

  if (Object.keys(game.playSequency).length <= 1) {
    components = [];
    game.embed.fields = [
      {
        name: t("elimination.embed.fields.0.name_finish", { e, locale }),
        value: t("elimination.embed.fields.0.value_win", { e, locale, user: `<@${Object.keys(game.players)[0]}>` })
      }
    ];
    await Database.Games.delete(`Elimination.${guildId}.${channelId}.${message.id}`);
  } else {
    game.embed.fields = [
      {
        name: t("elimination.embed.fields.0.name_turn", { e, locale }),
        value: t("elimination.embed.fields.0.value_turn", { e, locale, user: `<@${game.playSequency[game.playNowIndex]}>` })
      }
    ];
    await Database.Games.set(`Elimination.${guildId}.${channelId}.${message.id}`, game);
  }

  return await interaction.editReply({
    embeds: [game.embed],
    components
  });
}