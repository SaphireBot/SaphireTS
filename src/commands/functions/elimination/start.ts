import { APIEmbed, ButtonInteraction, ButtonStyle, Collection, User } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { EliminationCache } from "../../../@types/commands";

export default async function start(
  interaction: ButtonInteraction<"cached">,
  players: Collection<string, User>,
) {

  const { channel, guild, userLocale, message } = interaction;
  const locale = guild.preferredLocale || userLocale || client.defaultLocale;
  const comps: any[] = [];

  for (let i = 1; i <= 20; i++)
    comps.push({
      type: 2,
      label: format(i),
      custom_id: JSON.stringify({
        c: "elimination",
        src: "click",
        i,
      }),
      style: ButtonStyle.Secondary,
    });

  const arr = comps.shuffle();
  const components = [];

  for (let i = 0; i < 20; i += 5)
    components.push({
      type: 1,
      components: arr.splice(0, 5),
    });

  components.push({
    type: 1,
    components: [
      {
        type: 2,
        label: t("elimination.i_forgot_my_number"),
        emoji: e.Animated.SaphireReading,
        custom_id: JSON.stringify({
          c: "elimination",
          src: "my_number",
        }),
        style: ButtonStyle.Primary,
      },
      {
        type: 2,
        label: t("elimination.resend_message"),
        emoji: "⬇️",
        custom_id: JSON.stringify({
          c: "elimination",
          src: "refresh",
        }),
        style: ButtonStyle.Primary,
      },
    ],
  });

  const gameData = await Database.Games.get(`Elimination.${guild.id}.${channel!.id}.${message.id}`) as EliminationCache;
  const embed = message.embeds[0]?.toJSON() || {} as APIEmbed;
  await interaction.message.delete().catch(() => { });

  if (!gameData)
    return await interaction.channel?.send("No data found");

  const msg = await channel!.send({
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("elimination.iniciating", locale),
            emoji: e.Loading,
            custom_id: "disabled",
            style: ButtonStyle.Primary,
            disabled: true,
          },
        ].asMessageComponents(),
      },
    ],
  })
    .catch(async () => {
      await Database.Games.delete(`Elimination.${guild.id}.${channel!.id}.${message.id}`);
      return;
    });

  await sleep(1500);
  if (!msg?.id) return;

  const gameKey = `Elimination.${guild.id}.${channel!.id}.${msg.id}`;
  const playSequency: Record<number, string> = {};

  let i = 0;
  for (const id of Array.from(players.keys())) {
    playSequency[i] = id;
    i++;
  }

  await Database.Games.set(gameKey, {
    players: gameData.players,
    playSequency,
    playNowIndex: 0,
    eliminated: {},
    embed: embed,
    clicks: [],
  } as EliminationCache);

  embed.fields = [
    {
      name: t("elimination.embed.fields.0.name_turn", { e, locale }),
      value: t("elimination.embed.fields.0.value_turn", { e, locale, user: players.get(playSequency[0]) }),
    },
  ];

  return await msg.edit({
    embeds: [embed],
    components,
  })
    .catch(async () => {
      await Database.Games.delete(gameKey);
      return await msg.delete().catch(() => { });
    });

  function format(num: number) {
    return num < 10 ? `0${num}` : num;
  }

}