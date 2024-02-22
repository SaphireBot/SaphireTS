import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import remove from "../../functions/ban/remove";
import add from "../../functions/ban/add";
import list from "../../functions/ban/list";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    data: {
        type: ApplicationCommandType.ChatInput,
        application_id: client.user?.id,
        guild_id: "",
        name: "ban",
        name_localizations: getLocalizations("ban.name"),
        description: "[moderation] Just a simples command to ban someone",
        description_localizations: getLocalizations("ban.description"),
        default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "add",
                name_localizations: getLocalizations("ban.options.0.name"),
                description: "[moderation] Ban users from this guild",
                description_localizations: getLocalizations("ban.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "users",
                        name_localizations: getLocalizations("ban.options.0.options.0.name"),
                        description: "A user to ban. Or, some users",
                        description_localizations: getLocalizations("ban.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "time",
                        name_localizations: getLocalizations("ban.options.0.options.1.name"),
                        description: "How long time this member keep be banned",
                        description_localizations: getLocalizations("ban.options.0.options.1.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true
                    },
                    {
                        name: "reason",
                        name_localizations: getLocalizations("ban.options.0.options.2.name"),
                        description: "The ban's reason",
                        description_localizations: getLocalizations("ban.options.0.options.2.description"),
                        type: ApplicationCommandOptionType.String,
                        max_length: 512,
                        min_length: 0
                    },
                    {
                        name: "message_history",
                        name_localizations: getLocalizations("ban.options.0.options.3.name"),
                        description: "Delete message history (Seconds)",
                        description_localizations: getLocalizations("ban.options.0.options.3.description"),
                        type: ApplicationCommandOptionType.Integer,
                        autocomplete: true
                    },
                ]
            },
            {
                name: "remove",
                name_localizations: getLocalizations("ban.options.1.name"),
                description: "[moderation] Select users to remove their ban",
                description_localizations: getLocalizations("ban.options.1.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "users",
                        name_localizations: getLocalizations("ban.options.1.options.0.name"),
                        description: "Users who will have their bans removed",
                        description_localizations: getLocalizations("ban.options.1.options.0.description"),
                        type: ApplicationCommandOptionType.User,
                        autocomplete: true,
                        required: true
                    },
                    {
                        name: "reason",
                        name_localizations: getLocalizations("ban.options.1.options.1.name"),
                        description: "The unban's reason",
                        description_localizations: getLocalizations("ban.options.1.options.1.description"),
                        type: ApplicationCommandOptionType.String,
                        max_length: 100
                    }
                ]
            },
            {
                name: "list",
                name_localizations: getLocalizations("ban.options.2.name"),
                description: "A list with all users banned",
                description_localizations: getLocalizations("ban.options.2.description"),
                type: ApplicationCommandOptionType.Subcommand,
            }
        ]
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            name: "ban",
            description: "Um simples comando para banir",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.BanMembers],
                bot: [DiscordPermissons.BanMembers]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { guild, options } = interaction;

            if (!interaction.member?.permissions.has(PermissionFlagsBits.BanMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

            if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_client_need_some_permissions");

            if (options.getSubcommand() === "add") return await add(interaction);
            if (options.getSubcommand() === "remove") return await remove(interaction);
            if (options.getSubcommand() === "list") return await list(interaction);

            return;
        }
    }
};