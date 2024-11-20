import { Message, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import autorole from "../../functions/autorole";

export default {
    name: "autorole",
    description: "[moderation] A means of automating the handover of roles when a new member joins into guild",
    aliases: ["ar"],
    category: "moderation",
    api_data: {
        name: "autorole",
        description: "Um meio de automatizar a transferência de cargos quando um novo membro entrar no servidor",
        category: "Moderação",
        synonyms: [],
        tags: [],
        perms: {
            user: [DiscordPermissons.ManageRoles],
            bot: [DiscordPermissons.ManageRoles],
        },
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

        if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_client_need_some_permissions");

        return await autorole(message);
    },
};