import { Message } from "discord.js";
import { askForConfirmation } from "../../../structures/payment";
import { e } from "../../../util/json";
import Database from "../../../database";
import { t } from "../../../translator";

export default {
  name: "test",
  description: "nothing",
  aliases: [],
  category: "admin",
  api_data: {
    category: "admin",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, __: string[] | undefined) {

    const clientData = await Database.getClientData();
    if (!clientData?.Administradores?.includes(message.author.id))
      return await message.reply({
        content: `${e.Animated.SaphireReading} | ${t("System_cannot_use_this_command", message.userLocale)}`
      })
        .then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));

    return await askForConfirmation(message);
  }
};