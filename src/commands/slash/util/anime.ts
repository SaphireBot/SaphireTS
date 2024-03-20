import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import search from "../../functions/anime/search.anime";
import indications from "../../functions/anime/indications.anime";

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
        name: "anime",
        name_localizations: getLocalizations("anime.name"),
        description: "[util] Search an anime by name or character",
        description_localizations: getLocalizations("anime.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "search",
                name_localizations: getLocalizations("anime.options.0.name"),
                type: ApplicationCommandOptionType.Subcommand,
                description: "[util] Search an anime by name or character",
                description_localizations: getLocalizations("anime.options.0.description"),
                options: [
                    {
                        name: "input",
                        name_localizations: getLocalizations("anime.options.0.options.0.name"),
                        description: "Search an anime by name or character",
                        description_localizations: getLocalizations("anime.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "anime_or_manga",
                        name_localizations: getLocalizations("anime.options.0.options.1.name"),
                        description: "Anime or Manga?",
                        description_localizations: getLocalizations("anime.options.0.options.1.description"),
                        type: ApplicationCommandOptionType.String,
                        choices: [
                            {
                                name: "Anime",
                                name_localizations: getLocalizations("anime.options.0.options.1.choices.0"),
                                value: "anime"
                            },
                            {
                                name: "Manga",
                                name_localizations: getLocalizations("anime.options.0.options.1.choices.1"),
                                value: "manga"
                            }
                        ]
                    },
                    {
                        name: "options",
                        name_localizations: getLocalizations("anime.options.0.options.2.name"),
                        description: "Aditional options",
                        description_localizations: getLocalizations("anime.options.0.options.2.description"),
                        type: ApplicationCommandOptionType.String,
                        choices: [
                            {
                                name: "Hide the result, just I must see it",
                                name_localizations: getLocalizations("anime.options.0.options.2.choices.0"),
                                value: "hide"
                            }
                        ]
                    }
                ]
            },
            {
                name: "indications",
                name_localizations: getLocalizations("anime.options.1.name"),
                type: ApplicationCommandOptionType.Subcommand,
                description: "[util] Get some anime indications",
                description_localizations: getLocalizations("anime.options.1.description"),
                options: []
            },

        ]
    },
    additional: {
        category: "util",
        admin: false,
        staff: false,
        api_data: {
            name: "anime",
            description: "Pesquise por algum anime utilizando o nome ou personagem",
            category: "Utilidades",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("anime.name") || {}
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

            const { options } = interaction;
            const subCommand = options.getSubcommand();

            if (subCommand === "search")
                return await search(interaction, options.getString("options") === "hide");

            if (subCommand === "indications")
                return await indications(interaction);
        }
    }
};