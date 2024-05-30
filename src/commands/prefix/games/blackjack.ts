import { Message } from "discord.js";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Blackjack from "../../../structures/blackjack/blackjack";
import Database from "../../../database";

export default {
  name: "blackjack",
  description: "[game] Jogue blackjack com seus amigos",
  aliases: ["bj", "21"],
  category: "games",
  api_data: {
    category: "Jogos",
    synonyms: ["bj", "21"],
    tags: ["new"],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { channelId, userLocale: locale, author } = message;

    if (ChannelsInGame.has(channelId))
      return await message.reply({
        content: t("glass.channel_in_use", { e, locale })
      })
        .then(msg => setTimeout(async () => await msg?.delete().catch(() => { }), 6000))
        .catch(() => { });

    let value = 0;

    if (args?.length)
      value = args.at(-1)?.toNumber() || 0;

    if (value > 0) {
      const balance = (await Database.getUser(author.id))?.Balance || 0;

      if (value > balance)
        return await message.reply({
          content: t("pay.balance_not_enough", { e, locale })
        });
    }

    return new Blackjack(message, { value });
  }
};