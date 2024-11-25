import { Message } from "discord.js";
import JogoDoBicho from "../../../structures/bicho/bicho";
import { ChannelsInGame } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default {
  name: "bicho",
  description: "O jogo do bicho",
  aliases: ["jogodobicho"],
  category: "games",
  api_data: {
    category: "Jogos",
    synonyms: ["jogodobicho"],
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async (message: Message<true>, _: string[] | undefined) => {

    if (ChannelsInGame.has(message.channelId))
      return await message.reply({
        content: t("lastclick.this_channels_is_in_game", { e, locale: message.userLocale }),
      });

    ChannelsInGame.add(message.channelId);
    return await new JogoDoBicho(message).lauch();
  },
};