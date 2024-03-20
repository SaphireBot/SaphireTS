import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import bitcoin from "../../functions/bitcoin/execute";

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
        name: "bitcoin",
        description: "Get 5 millions Sapphires when get the target",
        description_localizations: getLocalizations("bitcoin.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "reminder",
                name_localizations: getLocalizations("bitcoin.options.0.name"),
                description: "Set an automatic reminder",
                description_localizations: getLocalizations("bitcoin.options.0.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Remember me when a new bitcoin is available",
                        name_localizations: getLocalizations("bitcoin.options.0.choices.0"),
                        value: "yes"
                    },
                    {
                        name: "I do not need it",
                        name_localizations: getLocalizations("bitcoin.options.0.choices.1"),
                        value: "no"
                    }
                ]
            },
            {
                name: "user",
                name_localizations: getLocalizations("bitcoin.options.1.name"),
                description: "See the bitcoin status from an user",
                description_localizations: getLocalizations("bitcoin.options.1.description"),
                type: ApplicationCommandOptionType.User
            }
        ]
    },
    additional: {
        category: "economy",
        admin: false,
        staff: false,
        api_data: {
            name: "bitcoin",
            description: "Pegue alguns bitcoins e fature 5.000.000 Safiras",
            category: "Economia",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("bitcoin.name") || {}
                    )
                )
            ),
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        execute: async (interaction: ChatInputCommandInteraction<"cached">) => await bitcoin(interaction)
    }
};