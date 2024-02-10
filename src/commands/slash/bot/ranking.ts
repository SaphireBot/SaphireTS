import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import globalRanking from "../../functions/ranking/global/ranking";

const choices = ["balance", "likes", "experience", "logomarca", "flags", "quiz_anime", "quiz_questions", "daily"]
    .map((str, i) => ({
        name: str,
        name_localizations: getLocalizations(`ranking.options.0.choices.${i}`),
        value: str
    }));

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
        name: "ranking",
        name_localizations: getLocalizations("ranking.name"),
        description: "[bot] A way to see all rankings",
        description_localizations: getLocalizations("ranking.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        options: [
            {
                name: "category",
                name_localizations: getLocalizations("ranking.options.0.name"),
                description: "The ranking category",
                description_localizations: getLocalizations("ranking.options.0.descrition"),
                type: ApplicationCommandOptionType.String,
                choices
            },
            {
                name: "options",
                name_localizations: getLocalizations("ranking.options.1.name"),
                description: "More options to ranking command",
                description_localizations: getLocalizations("ranking.options.1.descrition"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "script",
                        name_localizations: getLocalizations("ranking.options.1.choices.0"),
                        value: "script"
                    }
                ]
            }
        ]
    },
    additional: {
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "ranking",
            description: "Um poderoso sistema de multiplos rankings",
            category: "Saphire",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        execute: async (interaction: ChatInputCommandInteraction) => await globalRanking(interaction)
    }
};