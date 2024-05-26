import { Message } from "discord.js";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Blackjack from "../../../structures/blackjack/blackjack";

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
  execute: async function (message: Message<true>, _: string[] | undefined) {

    if (ChannelsInGame.has(message.channelId))
      return await message.reply({
        content: t("glass.channel_in_use", { e, locale: message.userLocale })
      })
        .then(msg => setTimeout(async () => await msg?.delete().catch(() => { }), 6000))
        .catch(() => { });

    return new Blackjack(message, {});
  }
};