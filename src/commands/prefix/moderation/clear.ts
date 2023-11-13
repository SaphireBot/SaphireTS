import { Message, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import clear from "../../functions/clear/clear";
const aliases = ["limpar", "löschen", "清除", "クリア", "effacer", "borrar", "cls", "clean", "sweep"];

export default {
    name: "clear",
    description: "Amount of messages to be deleted (1~1000)",
    aliases,
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [DiscordPermissons.ManageMessages],
            bot: [DiscordPermissons.ManageMessages, DiscordPermissons.ReadMessageHistory]
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        const { guild, member } = message;

        if (!member?.permissions.has([PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages], true))
            return await permissionsMissing(message, [DiscordPermissons.ReadMessageHistory, DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has([PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages], true))
            return await permissionsMissing(message, [DiscordPermissons.ReadMessageHistory, DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

        return await clear(message);
    }
};