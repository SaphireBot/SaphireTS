import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";

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
        name: "daily",
        name_localizations: getLocalizations("daily.name"),
        description: "Get a daily rewards",
        description_localizations: getLocalizations("daily.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        options: [
            {
                name: "transfer",
                name_localizations: getLocalizations("daily.options.0.name"),
                description: "Transfer your daily reward to someone",
                description_localizations: getLocalizations("daily.options.0.description"),
                type: ApplicationCommandOptionType.User
            },
            {
                name: "options",
                name_localizations: getLocalizations("daily.options.1.name"),
                description: "Some options to daily command",
                description_localizations: getLocalizations("daily.options.1.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Daily Status",
                        name_localizations: getLocalizations("daily.options.1.choices.0.name"),
                        value: "sequency"
                    },
                    {
                        name: "Activate automatic reminder",
                        name_localizations: getLocalizations("daily.options.1.choices.1.name"),
                        value: "reminder"
                    },
                    {
                        name: "Activate automatic reminder at DM",
                        name_localizations: getLocalizations("daily.options.1.choices.2.name"),
                        value: "reminderPrivate"
                    }
                ]
            }
        ]
    },
    additional: {
        category: "",
        admin: false,
        staff: false,
        api_data: {
            name: "daily",
            description: "Get a daily rewards",
            category: "economy",
            synonyms: ["daily", "diario", "diário"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {



        }
    }
};