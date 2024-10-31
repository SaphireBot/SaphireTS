import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import create from "../../functions/reminder/create";
import view from "../../functions/reminder/view";

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
        name: "reminder",
        name_localizations: getLocalizations("reminder.name"),
        description: "[util] Create some reminders to help you",
        description_localizations: getLocalizations("reminder.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "create",
                name_localizations: getLocalizations("reminder.options.0.name"),
                description: "Create a reminder",
                description_localizations: getLocalizations("reminder.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "message",
                        name_localizations: getLocalizations("reminder.options.0.options.0.name"),
                        description: "The reminder's message",
                        description_localizations: getLocalizations("reminder.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        min_length: 1,
                        max_length: 700,
                        required: true,
                    },
                    {
                        name: "time",
                        name_localizations: getLocalizations("reminder.options.0.options.1.name"),
                        description: "When this reminder must be emitted",
                        description_localizations: getLocalizations("reminder.options.0.options.1.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true,
                        required: true,
                    },
                    {
                        name: "interval",
                        name_localizations: getLocalizations("reminder.options.0.options.2.name"),
                        description: "A interval to this reminder",
                        description_localizations: getLocalizations("reminder.options.0.options.2.description"),
                        type: ApplicationCommandOptionType.Integer,
                        choices: [
                            {
                                name: "daily",
                                name_localizations: getLocalizations("reminder.options.0.options.2.choices.0"),
                                value: 1,
                            },
                            {
                                name: "weekly",
                                name_localizations: getLocalizations("reminder.options.0.options.2.choices.1"),
                                value: 2,
                            },
                            {
                                name: "monthly",
                                name_localizations: getLocalizations("reminder.options.0.options.2.choices.2"),
                                value: 3,
                            },
                        ],
                    },
                    {
                        name: "dm",
                        name_localizations: getLocalizations("reminder.options.3.name"),
                        description: "Is DM or in guild the notification",
                        description_localizations: getLocalizations("reminder.options.3.description"),
                        type: ApplicationCommandOptionType.String,
                        choices: [
                            {
                                name: "Send me at DM",
                                name_localizations: getLocalizations("reminder.options.0.options.3.choices.0"),
                                value: "dm",
                            },
                            {
                                name: "Send me at mentionable channel",
                                name_localizations: getLocalizations("reminder.options.0.options.3.choices.1"),
                                value: "guild",
                            },
                        ],
                    },
                ],
            },
            {
                name: "view",
                name_localizations: getLocalizations("reminder.options.1.name"),
                description: "View your reminders",
                description_localizations: getLocalizations("reminder.options.1.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "reminder",
                        name_localizations: getLocalizations("reminder.options.1.options.0.name"),
                        description: "Select a reminder",
                        description_localizations: getLocalizations("reminder.options.1.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true,
                    },
                ],
            },
        ],
    },
    additional: {
        category: "util",
        admin: false,
        staff: false,
        api_data: {
            name: "reminder",
            description: "[util] Create some reminders to help you",
            category: "Utilidades",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const options = interaction.options;
            const subcommand = options.getSubcommand();
            if (subcommand === "create") {
                return await create(
                    interaction,
                    {
                        interval: options.getInteger("interval") as 1 | 2 | 3 || 0,
                        message: options.getString("message") || "",
                        time: options.getString("time") || "",
                        dm: options.getString("dm") === "dm" || !interaction.inGuild(),
                        originalMessage: undefined,
                        isAutomatic: false,
                    },
                );
            }

            if (subcommand === "view") return await view(interaction);
            return;
        },
    },
};