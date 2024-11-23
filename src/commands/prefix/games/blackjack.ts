import { Message } from "discord.js";
import { ChannelsInGame, allWordTranslations } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Blackjack from "../../../structures/blackjack/blackjack";
import Database from "../../../database";
import { BlackjackData } from "../../../@types/commands";

export default {
  name: "blackjack",
  description: "[game] Jogue blackjack com seus amigos",
  aliases: ["bj", "21"],
  category: "games",
  api_data: {
    category: "Diversão",
    synonyms: ["bj", "21"],
    tags: ["new"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { channelId, userLocale: locale, author, guildId } = message;

    if (ChannelsInGame.has(channelId))
      return await message.reply({
        content: t("glass.channel_in_use", { e, locale }),
      })
        .then(msg => setTimeout(async () => await msg?.delete().catch(() => { }), 6000))
        .catch(() => { });

    let value = 0;

    if (args?.length)
      value = args.at(-1)?.toNumber() || 0;

    if (allWordTranslations.includes(args?.[0]?.toLowerCase() || ""))
      value = 1;

    if (value > 0) {
      const balance = (await Database.getUser(author.id))?.Balance || 0;

      if (allWordTranslations.includes(args?.[0]?.toLowerCase() || ""))
        value = balance;

      if (value > balance)
        return await message.reply({
          content: t("pay.balance_not_enough", { e, locale }),
        });
    }

    const data = (await Database.Users.findOne({ id: author.id }))?.Blackjack as BlackjackData;
    if (data) {
      data.channelId = channelId;
      data.guildId = guildId;
      await Database.Games.set(`Blackjack.${author.id}`, data) as BlackjackData;
      await Database.Users.updateOne(
        { id: author.id },
        { $unset: { Blackjack: true } },
      );
      return new Blackjack(undefined, data);
    }

    return new Blackjack(message, { value });
  },
};