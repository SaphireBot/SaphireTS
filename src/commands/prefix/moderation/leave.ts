import { Message, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import configLeave from "../../../structures/leave/config.leave";
import lauchLeave from "../../../structures/leave/lauch.leave";

export default {
  name: "leave",
  description: "Comando de Notificação do Sistema de Saída",
  aliases: [],
  category: "moderation",
  api_data: {
    category: "Moderação",
    synonyms: [],
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

    if (!args?.length) return await lauchLeave(message, "reply");

    if (args[0] === "config")
      return await configLeave(message);
  },
};