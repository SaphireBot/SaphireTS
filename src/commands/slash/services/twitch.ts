import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import search from "../../functions/twitch/search";
import enable from "../../functions/twitch/enable";
import disable from "../../functions/twitch/disable";
import list from "../../functions/twitch/list";

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
        name: "twitch",
        description: "A simple way to get a notification when streamer is online",
        description_localizations: getLocalizations("twitch.description"),
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "enable",
                name_localizations: getLocalizations("twitch.options.0.name"),
                description: "[moderation] Enable notifications for a Twitch channel on the server",
                description_localizations: getLocalizations("twitch.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "streamers",
                        type: ApplicationCommandOptionType.String,
                        description: "streamer1, another_streamer, https://twitch.tv/streamer, streamer3 (Max: 100 Streamers)",
                        min_length: 4,
                        required: true,
                    },
                    {
                        name: "channel",
                        name_localizations: getLocalizations("twitch.options.0.options.1.name"),
                        type: ApplicationCommandOptionType.Channel,
                        description: "Channel to notification drop",
                        description_localizations: getLocalizations("twitch.options.0.options.1.description"),
                        required: true,
                        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
                    },
                    {
                        name: "role",
                        name_localizations: getLocalizations("twitch.options.0.options.2.name"),
                        type: ApplicationCommandOptionType.Role,
                        description: "A role to be notified",
                        description_localizations: getLocalizations("twitch.options.0.options.2.description"),
                    },
                    {
                        name: "message",
                        name_localizations: getLocalizations("twitch.options.0.options.3.name"),
                        type: ApplicationCommandOptionType.String,
                        description: "A custom message - \"$role\" mention the role | $streamer mention the streamer.",
                        description_localizations: getLocalizations("twitch.options.0.options.3.description"),
                        max_length: 700,
                    },
                ],
            },
            {
                name: "disable",
                name_localizations: getLocalizations("twitch.options.1.name"),
                description: "[moderation] Disable a streamer notification",
                description_localizations: getLocalizations("twitch.options.1.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "streamer",
                        type: ApplicationCommandOptionType.String,
                        description: "Which streamer do you want to disable?",
                        description_localizations: getLocalizations("twitch.options.1.description"),
                        required: true,
                        autocomplete: true,
                    },
                ],
            },
            {
                name: "list",
                name_localizations: getLocalizations("twitch.options.2.name"),
                description: "[moderation] A list with all streamers setted at this guild",
                description_localizations: getLocalizations("twitch.options.2.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [],
            },
            {
                name: "search",
                name_localizations: getLocalizations("twitch.options.3.name"),
                description: "[general] Search streamers/channels from Twitch",
                description_localizations: getLocalizations("twitch.options.3.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "type",
                        name_localizations: getLocalizations("twitch.options.3.options.0.name"),
                        description: "Choose a type",
                        description_localizations: getLocalizations("twitch.options.3.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            {
                                name: "Category, Games, Others...",
                                name_localizations: getLocalizations("twitch.options.3.options.0.choices.0"),
                                value: "categories",
                            },
                            {
                                name: "Channels or Streamers",
                                name_localizations: getLocalizations("twitch.options.3.options.0.choices.1"),
                                value: "channels",
                            },
                        ],
                    },
                    {
                        name: "input",
                        name_localizations: getLocalizations("twitch.options.3.options.1.name"),
                        type: ApplicationCommandOptionType.String,
                        description: "Type your search and good luck!",
                        description_localizations: getLocalizations("twitch.options.3.options.1.description"),
                        required: true,
                    },
                ],
            },
        ],
    },
    additional: {
        category: "services",
        admin: false,
        staff: false,
        api_data: {
            name: "twitch",
            description: "Um meio simples de ser notificado quando um streamer está online",
            category: "Serviços",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.ManageGuild],
                bot: [DiscordPermissons.SendMessages],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {
            const Subcommand = interaction.options.getSubcommand() as "search" | "enable" | "disable" | "list";
            return { search, enable, disable, list }[Subcommand](interaction);
        },
    },
};