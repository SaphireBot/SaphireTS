import { ChatInputCommandInteraction, Colors, Message, StringSelectMenuInteraction } from "discord.js";
import reply from "../reply";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import Database from "../../../../../database";
import { categories } from "../ranking";
import client from "../../../../../saphire";
import { BooleanExpression } from "mongoose";
import Experience from "../../../../../managers/experience/experience";

export const rankingRawData = {
  data: [] as { id: string, position: number, Level: number }[],
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

export default async function levelRanking(
  interaction: ChatInputCommandInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | Message<true>,
) {

  const { userLocale: locale, member } = interaction;
  const user = "author" in interaction ? interaction.author : interaction.user;

  const msg = await reply(
    interaction, undefined,
    { content: t("ranking.building", { e, locale }) },
  );

  if (!rankingRawData.data.length) {
    await requestLevelRank(true);
    await reply(interaction, msg, {
      content: t("ranking.users_database_getted", { e, locale, users: rankingRawData.data.length.currency() }),
      embeds: [], components: [],
    });
  }

  if (!rankingRawData.data.length)
    return await reply(
      interaction, undefined,
      { content: t("ranking.no_content_found", { e, locale }) });

  const userPosition = (await Experience.rank(user.id)).position || 0;
  const description: string[] = [];

  for await (const data of rankingRawData.data) {
    const user = await client.users.fetch(data.id).catch(() => undefined);
    if (!user) continue;
    if (user?.username.includes("deleted_user_")) {
      rankingRawData.usersToDelete.add(data.id);
      description.push(`${data.position}. DELETED USER\n \n`);
      continue;
    }
    description.push(`${data.position}. ${user?.username || "??"} \`${data.id}\`\n${e.RedStar} Level ${(data.Level || 1).currency()}\n \n`);
    await sleep(1500);
  }

  await reply(
    interaction,
    msg,
    {
      content: null,
      embeds: [{
        color: Colors.Blue,
        title: t("ranking.embed.title.level", locale),
        description: description.join(""),
        timestamp: new Date(rankingRawData.refreshIn).toISOString(),
        footer: {
          text: `${t("ranking.embed.footer", { locale, index: userPosition || "N/A" })} | Next Update in`,
          icon_url: member?.displayAvatarURL() || user.displayAvatarURL(),
        },
      }],
      components: [{
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
      }],
    });

  if (rankingRawData.toRefresh)
    await requestLevelRank(true);

  if (rankingRawData.usersToDelete.size)
    await Database.Users.deleteMany({ id: { $in: Array.from(rankingRawData.usersToDelete) } });

}

async function requestLevelRank(fetch?: BooleanExpression) {

  if (!fetch && rankingRawData.data.length) return rankingRawData.data;

  const res = await Database.Users.aggregate([
    {
      $set: { Level: { $ifNull: ["$Experience.Level", 1] } },
    },
    {
      $setWindowFields: {
        partitionBy: null,
        sortBy: { Level: -1 },
        output: { position: { $documentNumber: {} } },
      },
    },
    {
      $project: { _id: null, id: true, Level: true, position: true },
    },
    {
      $limit: 10,
    },
  ]) as { _id: null, id: string, Level: number, position: number }[];

  rankingRawData.toRefresh = false;
  rankingRawData.data = res;
  return res;
}