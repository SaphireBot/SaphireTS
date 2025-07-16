import { Message, PermissionFlagsBits } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";

export default {
    name: "verification",
    description: "A quickly member verification method",
    aliases: ["vr"],
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: ["vr"],
        tags: ["new"],
        perms: {
            user: [DiscordPermissons.ModerateMembers],
            bot: [DiscordPermissons.ModerateMembers]
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        const { userLocale: locale, guild, author, member } = message;

        if (!member?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.ModerateMembers], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.ModerateMembers], "Discord_client_need_some_permissions");

        const verificationData = await Database.Guilds.findOne({ id: guild.id });

        if (verificationData)
            return await message.reply({
                content: "Components V2",
                /**
                 * New Components V2 with buttons into embed
                 * 
                 * Embed
                 * ** Custom Embed
                 * * System Embed
                 * Title: Quickly Member Verification
                 * Description: Short explanation
                 * Fields: Roles and Channel setted, Amount clicks given
                 * 
                 * 
                 * Buttons
                 * Delete actual verification
                 * Edit roles from actual verification
                 * Keep actual verification and delete this message
                 * 
                 */
            });

        return await message.reply({ 
            /**
             * Components V2
             * Select Menu to pick up roles to set into this system
             */
        });

    }
};