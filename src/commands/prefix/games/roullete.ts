import { Message } from "discord.js";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import RussianRoulette from "../../../structures/roulette/roulette";

const aliases = ["ruleta", "russisches", "roleta", "俄罗斯轮盘赌", "ロシアンルーレット", "roletarussa", "rol", "rou"];

export default {
  name: "roulette",
  description: "Play a russian roullete",
  aliases,
  category: "game",
  api_data: {
    category: "Jogos",
    synonyms: aliases,
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { channelId, userLocale: locale } = message;

    if (ChannelsInGame.has(channelId))
      return await message.reply({
        content: t("lastclick.this_channels_is_in_game", { e, locale }),
      });

    ChannelsInGame.add(channelId);
    return await new RussianRoulette(message).chooseGameMode();
  },
};