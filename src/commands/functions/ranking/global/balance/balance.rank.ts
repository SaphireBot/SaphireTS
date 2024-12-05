import { ButtonStyle, ChatInputCommandInteraction, Colors, Message, parseEmoji, StringSelectMenuInteraction } from "discord.js";
import reply from ".././reply";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import Database from "../../../../../database";
import { categories } from ".././ranking";
import client from "../../../../../saphire";
import { BooleanExpression } from "mongoose";

export const rankingRawData = {
  data: [] as { id: string, position: number, Balance: number }[],
  toRefresh: false,
  refreshIn: Date.now() + ((1000 * 60) * 5),
  usersToDelete: new Set<string>(),
};

setInterval(async () => {
  rankingRawData.toRefresh = true;
  rankingRawData.refreshIn = Date.now() + ((1000 * 60) * 5);
  if (rankingRawData.usersToDelete.size) {
    await Database.Users.deleteMany({ id: { $in: Array.from(rankingRawData.usersToDelete) } });
    rankingRawData.usersToDelete.clear();
  }
}, (1000 * 60) * 5);

export default async function balanceRanking(
  interaction: ChatInputCommandInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | Message<true>,
) {

  const { userLocale: locale, member } = interaction;
  const user = "author" in interaction ? interaction.author : interaction.user;

  const msg = await reply(
    interaction, undefined,
    { content: t("ranking.building", { e, locale }) },
  );

  if (!rankingRawData.data.length) {
    await requestBalanceRank(true);
    await reply(interaction, msg, {
      content: t("ranking.users_database_getted", { e, locale, users: rankingRawData.data.length.currency() }),
      embeds: [], components: [],
    });
  }

  if (!rankingRawData.data.length)
    return await reply(
      interaction, undefined,
      { content: t("ranking.no_content_found", { e, locale }) });

  const userPosition = await Database.getBalance(user.id, "position");
  const description: string[] = [];

  for await (const { id, Balance, position } of rankingRawData.data.slice(0, 10)) {
    const user = await client.users.fetch(id).catch(() => undefined);
    if (!user) continue;
    if (user?.username.includes("deleted_user_")) {
      rankingRawData.usersToDelete.add(id);
      description.push(`${position}. DELETED USER\n \n`);
      continue;
    }
    description.push(`${position}. ${user?.username || "??"} \`${id}\`\n${e.safira} ${Balance.currency()} ${t("keyword_Sapphires", locale)}\n \n`);
  }

  const components = [{
    type: 1,
    components: [{
      type: 3,
      custom_id: JSON.stringify({ c: "ranking", uid: user.id }),
      placeholder: t("ranking.select_menu.placeholder", locale),
      options: categories.map(({ type, emoji }) => ({
        label: t(`ranking.select_menu.options.${type}`, locale),
        value: type,
        emoji,
      })),
    }],
  }].asMessageComponents();

  if (rankingRawData.data.length > 10)
    components.unshift({
      type: 1,
      components: [
        {
          type: 2,
          emoji: parseEmoji("⏪"),
          custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "zero", i: 0 }),
          style: ButtonStyle.Primary,
        },
        {
          type: 2,
          emoji: parseEmoji("⬅️"),
          custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "preview", i: 0 }),
          style: ButtonStyle.Primary,
        },
        {
          type: 2,
          emoji: parseEmoji("➡️"),
          custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "next", i: 0 }),
          style: ButtonStyle.Primary,
        },
        {
          type: 2,
          emoji: parseEmoji("⏩"),
          custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "last", i: 0 }),
          style: ButtonStyle.Primary,
        },
      ],
    });

  await reply(
    interaction,
    msg,
    {
      content: null,
      embeds: [{
        color: Colors.Blue,
        title: `${t("ranking.embed.title.balance", locale)} - 1/${((rankingRawData.data?.length || 10) / 10).toFixed(0)}`,
        description: description.join(""),
        timestamp: new Date(rankingRawData.refreshIn).toISOString(),
        footer: {
          text: `${t("ranking.embed.footer", { locale, index: userPosition || "N/A" })} | Next Update in`,
          icon_url: member?.displayAvatarURL() || user.displayAvatarURL(),
        },
      }],
      components,
    });

  if (rankingRawData.toRefresh)
    await requestBalanceRank(true);
  
}

export async function requestBalanceRank(fetch?: BooleanExpression) {

  if (!fetch && rankingRawData.data.length) return rankingRawData.data;

  const res = await Database.Users.aggregate([
    {
      $set: { Balance: { $ifNull: ["$Balance", 0] } },
    },
    {
      $setWindowFields: {
        partitionBy: null,
        sortBy: { Balance: -1 },
        output: { position: { $documentNumber: {} } },
      },
    },
    {
      $project: { _id: null, id: true, Balance: true, position: true },
    },
  ]).limit(10) as { id: string, position: number, Balance: number }[];

  rankingRawData.toRefresh = false;
  rankingRawData.data = res;
  return res;
}