import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import serverinfo from "../../functions/serverinfo";

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
        name: "serverinfo",
        name_localizations: getLocalizations("serverinfo.name"),
        description: "[util] See some informations about a server",
        description_localizations: getLocalizations("serverinfo.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "search",
                name_localizations: getLocalizations("serverinfo.options.0.name"),
                description: "An server name or they ID",
                description_localizations: getLocalizations("serverinfo.options.0.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true
            }
        ]
    },
    additional: {
        category: "util",
        admin: false,
        staff: false,
        api_data: {
            name: "serverinfo",
            description: "Veja informações sobre algun servidor",
            category: "Utilidades",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("serverinfo.name") || {}
                    )
                )
            ),
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {
            return await serverinfo(interaction, []);
        }
    }
};