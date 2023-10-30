import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { DiscordPermissons } from "../../../util/constants";
import search from "../../functions/twitch/search";

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
        name_localizations: getLocalizations("twitch.name"),
        description: "A simple way to get a notification when streamer is online",
        description_localizations: getLocalizations("twitch.description"),
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
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
                        description_localizations: getLocalizations("twitch.options.0.options.0.description"),
                        min_length: 4,
                        required: true
                    },
                    {
                        name: "channel",
                        name_localizations: getLocalizations("twitch.options.0.options.1.name"),
                        type: ApplicationCommandOptionType.Channel,
                        description: "Channel to notification drop",
                        description_localizations: getLocalizations("twitch.options.0.options.1.description"),
                        required: true,
                        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                    },
                    {
                        name: "role",
                        name_localizations: getLocalizations("twitch.options.0.options.2.name"),
                        type: ApplicationCommandOptionType.Role,
                        description: "A role to be notified",
                        description_localizations: getLocalizations("twitch.options.0.options.2.description")
                    },
                    {
                        name: "message",
                        name_localizations: getLocalizations("twitch.options.0.options.3.name"),
                        type: ApplicationCommandOptionType.String,
                        description: "A custom message - \"$role\" mention the role | $streamer mention the streamer.",
                        description_localizations: getLocalizations("twitch.options.0.options.3.description"),
                        max_length: 700
                    }
                ]
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
                        autocomplete: true
                    }
                ]
            },
            {
                name: "informations",
                name_localizations: getLocalizations("twitch.options.2.name"),
                description: "[moderation] Informations about this system",
                description_localizations: getLocalizations("twitch.options.2.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: []
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
                                name_localizations: getLocalizations("twitch.options.3.options.0.choices.0.name"),
                                value: "categories"
                            },
                            {
                                name: "Channels or Streamers",
                                name_localizations: getLocalizations("twitch.options.3.options.0.choices.1.name"),
                                value: "channels"
                            }
                        ]
                    },
                    {
                        name: "input",
                        name_localizations: getLocalizations("twitch.options.3.options.1.name"),
                        type: ApplicationCommandOptionType.String,
                        description: "Type or search and good luck!",
                        description_localizations: getLocalizations("twitch.options.3.options.1.description"),
                        required: true
                    }
                ]
            },
            {
                name: "streams",
                name_localizations: getLocalizations("twitch.options.4.name"),
                description: "[general] Look some streamers online right now",
                description_localizations: getLocalizations("twitch.options.4.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "language",
                        name_localizations: getLocalizations("twitch.options.4.options.0.name"),
                        description: "Which language do you rather?",
                        description_localizations: getLocalizations("twitch.options.4.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true
                    },
                    {
                        name: "quantity",
                        name_localizations: getLocalizations("twitch.options.4.options.1.description"),
                        description: "How much streamers do you want? (default: 100)",
                        description_localizations: getLocalizations("twitch.options.4.options.1.description"),
                        type: ApplicationCommandOptionType.Integer,
                        choices: new Array(11)
                            .fill(1)
                            .map((_, i) => ({ name: `${i * 10} Streamers`, value: i * 10 }))
                            .concat([{ name: "1 Streamer", value: 1 }, { name: "5 Streamers", value: 5 }])
                            .slice(1, 13)
                            .sort((a, b) => a.value - b.value)
                    }
                ]
            }
        ]
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
                user: [DiscordPermissons.Administrator],
                bot: [DiscordPermissons.SendMessages]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options } = interaction;
            const Subcommand = options.getSubcommand();

            if (Subcommand === "search") return await search(interaction);
            // if (Subcommand === "streamers_online") return streamersOnline(interaction)

        }
    }
};