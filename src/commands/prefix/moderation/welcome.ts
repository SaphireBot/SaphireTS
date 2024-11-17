import { Message, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import configWelcome from "../../../structures/welcome/config.welcome";
import lauchWelcome from "../../../structures/welcome/lauch.welcome";

export default {
  name: "welcome",
  description: "Comando de Notificação do Sistema de Boas-Vindas",
  aliases: ["wel"],
  category: "moderation",
  api_data: {
    category: "Moderação",
    synonyms: ["wel"],
    tags: ["new", "building"],
    perms: {
      user: [],
      bot: [],
    },
  },
  execute: async function (message: Message<true>, args: string[] | undefined) {

    const { guild, member } = message;

    if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
      return await permissionsMissing(message, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

    if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
      return await permissionsMissing(message, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

    if (!args?.length) return await lauchWelcome(message, "reply");

    if (args[0] === "config")
      return await configWelcome(message);
  },
};