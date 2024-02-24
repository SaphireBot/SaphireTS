import { Message, PermissionFlagsBits } from "discord.js";
import payload from "../../functions/embed/payload";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";

export default {
  name: "embed",
  description: "Crie embeds facilmente no servidor",
  aliases: [],
  category: "util",
  api_data: {
    category: "Utilidades",
    synonyms: [],
    tags: [],
    perms: {
      user: [],
      bot: []
    }
  },
  execute: async function (message: Message<true>, _: string[] | undefined) {

    const { member, guild, author, userLocale: locale } = message;

    if (!member?.permissions.has(PermissionFlagsBits.ManageMessages, true))
      return await permissionsMissing(message, [DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageMessages, true))
      return await permissionsMissing(message, [DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

    return await message.reply(payload(locale, author.id));
  }
};