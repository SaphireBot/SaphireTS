import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import inGuildJokempo from "./jokempo/inGuild";
import { getLocalizations } from "../../../util/getlocalizations";

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
        name: "jokempo",
        name_localizations: getLocalizations("jokempo.name"),
        description: "[fun] One of the most played games on Planet Earth.",
        description_localizations: getLocalizations("jokempo.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "versus",
                name_localizations: getLocalizations("jokempo.options.0.name"),
                description: "[fun] Play against someone on this server.",
                description_localizations: getLocalizations("jokempo.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "member",
                        name_localizations: getLocalizations("jokempo.options.0.options.0.name"),
                        description: "Choose a member (excluding bots and myself) to play against",
                        description_localizations: getLocalizations("jokempo.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: "bet",
                        name_localizations: getLocalizations("jokempo.options.0.options.1.name"),
                        description: "Bet an amount of Safiras",
                        description_localizations: getLocalizations("jokempo.options.0.options.1.description"),
                        type: ApplicationCommandOptionType.Integer,
                        min_value: 1,
                        max_value: 1_000_000
                    }
                ]
            },
            // {
            //     name: 'global',
            //     name_localizations: getLocalizations("jokempo.options.1.name"),
            //     description: '[fun] Jogue um jokempo com qualquer outro usuário',
            //     type: ApplicationCommandOptionType.Subcommand,
            //     options: []
            // }
        ],
    },
    additional: {
        category: "games",
        admin: false,
        staff: false,
        api_data: {
            name: "jokempo",
            description: "Um dos jogos mais jogados no Planeta Terra.",
            category: "Diversão",
            synonyms: ["rock_paper_scissors", "piedra_papel_tijera", "pierre_papier_ciseaux", "じゃんけん"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const subCommand = interaction.options.getSubcommand();

            if (subCommand === "versus") return await inGuildJokempo(interaction);
            return;
        }
    }
};