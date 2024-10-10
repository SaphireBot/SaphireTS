import { ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, Message, User } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import start from "./start";
import Database from "../../../database";

export default async function lauch(
  interaction: ChatInputCommandInteraction<"cached"> | Message<true>,
) {

  const { guild, channel, userLocale } = interaction;
  const locale = guild.preferredLocale || userLocale || client.defaultLocale;
  const author = "user" in interaction ? interaction.user : interaction.author;
  const numbers = new Set<number>(Array(20).fill(1).map((_, i) => i + 1));
  const players = new Collection<string, User>();
  const playersNumbers: Record<string, number> = {};

  const embed = {
    color: Colors.Blue,
    title: t("elimination.embed.title", locale),
    description: t("elimination.embed.no_member", { e, locale }),
    fields: [
      {
        name: t("elimination.embed.fields.0.name", { e, locale }),
        value: t("elimination.embed.fields.0.value", { e, locale, author }),
      },
    ],
  };

  const msg = await interaction.reply({
    embeds: [embed],
    components: buttons(),
    fetchReply: true,
  })
    .catch(() => { });

  if (!msg) return;

  const gameKey = `Elimination.${guild.id}.${channel!.id}.${msg.id}`;
  await Database.Games.set(gameKey, { players: {} });
  const interval = setInterval(async () => await refresh(), 2000);
  let lastPlayersLengthRefresh = 0;
  refresh();
  const collector = msg.createMessageComponentCollector({
    filter: () => true,
    idle: 1000 * 60 * 3,
    componentType: ComponentType.Button,
  })
    .on("collect", async (int): Promise<any> => {

      const { customId, user, userLocale: locale } = int;

      if (customId === "cancel") {

        if (user.id === author.id)
          return collector.stop();

        return await int.reply({
          content: t("ping.you_cannot_click_here", { e, locale, username: author.username }),
          ephemeral: true,
        });
      }

      if (customId === "start") {

        if (user.id === author.id) {
          collector.stop("start");

          await int.update({
            components: buttons(true),
          });

          await sleep(2000);
          return await start(int, players);
        }

        return await int.reply({
          content: t("ping.you_cannot_click_here", { e, locale, username: author.username }),
          ephemeral: true,
        });
      }

      if (customId === "join") {

        if (players.has(user.id) && playersNumbers[user.id])
          return await int.reply({
            content: t("elimination.already_in", { e, locale, number: playersNumbers[user.id] }),
            ephemeral: true,
          });

        if (players.size >= 20 || !numbers.size)
          return await int.reply({
            content: t("elimination.limit", { e, locale }),
            ephemeral: true,
          });

        players.set(user.id, user);
        const number = random();
        playersNumbers[user.id] = number;
        await int.reply({
          content: t("elimination.joinned", { e, locale, number }),
          ephemeral: true,
        });
        await Database.Games.set(`${gameKey}.players.${user.id}`, number);
        return;
      }

      if (customId === "leave") {

        if (!players.has(user.id))
          return await int.reply({
            content: t("elimination.already_out", { e, locale }),
            ephemeral: true,
          });

        players.delete(user.id);
        numbers.add(playersNumbers[user.id]);
        delete playersNumbers[user.id];
        await int.reply({
          content: t("elimination.out", { e, locale }),
          ephemeral: true,
        });
        await Database.Games.delete(`${gameKey}.players.${user.id}`);
        return;
      }

    })
    .on("end", async (_, reason): Promise<any> => {
      clearInterval(interval);
      if (!msg || reason === "start") return;
      await Database.Games.delete(gameKey);
      return await msg.delete().catch(() => { });
    });

  async function refresh() {

    if ((lastPlayersLengthRefresh === players.size) || !msg)
      return;

    embed.description = Array.from(players.values())
      .map(user => `🔹 ${user}`)
      .join("\n") || t("elimination.embed.no_member", { e, locale });

    lastPlayersLengthRefresh = players.size;
    return await msg.edit({
      embeds: [embed],
      components: buttons(),
    });
  }

  function random() {
    const num = Array.from(numbers).random()!;
    numbers.delete(num);
    return num;
  }

  function buttons(started?: boolean) {
    return [{
      type: 1,
      components: [
        {
          type: 2,
          label: t("elimination.join", {
            locale,
            players: players.size,
          }),
          emoji: e.Animated.SaphireDance,
          custom_id: "join",
          style: ButtonStyle.Primary,
          disabled: started || players.size >= 20,
        },
        {
          type: 2,
          label: t("keyword_exit", locale),
          custom_id: "leave",
          emoji: "🏃",
          style: ButtonStyle.Primary,
          disabled: started || !players.size,
        },
        {
          type: 2,
          label: t("elimination.start", {
            locale,
            players: players.size > 2 ? 2 : players.size,
          }),
          custom_id: "start",
          emoji: started ? e.Loading : "🚩",
          style: ButtonStyle.Success,
          disabled: started || players.size < 2,
        },
        {
          type: 2,
          label: t("keyword_cancel", locale),
          custom_id: "cancel",
          emoji: e.Trash,
          style: ButtonStyle.Danger,
          disabled: started,
        },
      ],
    }];
  }

  return;
} 