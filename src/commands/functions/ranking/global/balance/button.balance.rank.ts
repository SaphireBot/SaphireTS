import { ButtonInteraction, ButtonStyle, Colors, LocaleString, parseEmoji } from "discord.js";
import { rankingRawData, requestBalanceRank } from "./balance.rank";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import client from "../../../../../saphire";
import Database from "../../../../../database";
import { categories } from ".././ranking";
import loadingButton from "../../../../../util/loadingButtons";

export default async function buttonBalanceRank(
  interaction: ButtonInteraction<"cached">,
  data: { c: "rank_balance", uid: string, src: "zero" | "preview" | "next" | "last", i: number },
) {

  const { user, userLocale: locale, message, customId, member } = interaction;
  if (user.id !== data?.uid) return;
  const buttonId = data?.src;
  let i = data?.i;

  if (message.partial) await message.fetch().catch(() => null);

  await interaction.update({ components: loadingButton(customId, message) });
  const rank = await requestBalanceRank();

  if (buttonId === "zero")
    i = 0;

  if (buttonId === "preview") {
    i -= 10;
    if (i < 0) i = rank.length - 10;
  }

  if (buttonId === "next") {
    i += 10;
    if (i >= rank.length) i = 0;
  }

  if (buttonId === "last")
    i = rank.length - 10;

  const userPosition = await Database.getBalance(user.id, "position");

  return await interaction.editReply({
    content: null,
    embeds: [{
      color: Colors.Blue,
      title: `${t("ranking.embed.title.balance", locale)} - ${((i / 10) + 1).toFixed(0)}/${((rank?.length || 10) / 10).toFixed(0)}`,
      description: await embedDescription(locale, i),
      timestamp: new Date(rankingRawData.refreshIn).toISOString(),
      footer: {
        text: `${t("ranking.embed.footer", { locale, index: userPosition || "N/A" })} | Next Update in`,
        icon_url: member?.displayAvatarURL() || user.displayAvatarURL(),
      },
    }],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            emoji: parseEmoji("⏪"),
            custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "zero", i }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: parseEmoji("⬅️"),
            custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "preview", i }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: parseEmoji("➡️"),
            custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "next", i }),
            style: ButtonStyle.Primary,
          },
          {
            type: 2,
            emoji: parseEmoji("⏩"),
            custom_id: JSON.stringify({ c: "rank_balance", uid: user.id, src: "last", i }),
            style: ButtonStyle.Primary,
          },
        ],
      },
      {
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
      },
    ].asMessageComponents(),
  });
}

async function embedDescription(locale: LocaleString, i: number) {
  let description = "";

  for await (const { id, Balance, position } of rankingRawData.data?.slice(i, i + 10) || []) {
    const user = await client.users.fetch(id).catch(() => undefined);

    if (!user) {
      description += `${position}. DELETED NOT FOUND\n \n`;
      continue;
    }

    if (user?.username.includes("deleted_user_")) {
      rankingRawData.usersToDelete.add(id);
      description += `${position}. DELETED USER\n \n`;
      continue;
    }

    const bal = Balance >= 0
      ? Balance.currency()
      : "-" + Balance.currency();

    description += `${position}. ${user?.username || "??"} \`${id}\`\n${e.safira} ${bal} ${t("keyword_Sapphires", locale)}\n \n`;
  }
  return description;
}