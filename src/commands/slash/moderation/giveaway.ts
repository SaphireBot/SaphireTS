import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
// import { e } from "../../../util/json";
import { t } from "../../../translator";

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
        name: "giveaway",
        name_localizations: getLocalizations("giveaway.name"),
        description: "[moderation] Create and manage giveaway in guild",
        description_localizations: getLocalizations("giveaway.description"),
        default_member_permissions: PermissionsBitField.Flags.ManageEvents.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "create",
                name_localizations: getLocalizations("giveaway.options.0.name"),
                description: "[moderation] Create a new giveaway",
                description_localizations: getLocalizations("giveaway.options.0.description"),
                type: 1,
                options: [
                    {
                        name: "prize",
                        name_localizations: getLocalizations("giveaway.options.0.options.0.name"),
                        description: "Giveaway's Prize (2~150 Character)",
                        description_localizations: getLocalizations("giveaway.options.0.options.0.description"),
                        min_length: 2,
                        max_length: 150,
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "duration",
                        name_localizations: getLocalizations("giveaway.options.0.options.1.name"),
                        description: "When is the draw due? (Ex: 1d 2h 3m) (Limit: 5 second ~ 2 years)",
                        description_localizations: getLocalizations("giveaway.options.0.options.1.description"),
                        max_length: 100,
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "channel",
                        name_localizations: getLocalizations("giveaway.options.0.options.2.name"),
                        description: "The giveaway's channel",
                        description_localizations: getLocalizations("giveaway.options.0.options.2.description"),
                        type: ApplicationCommandOptionType.Channel,
                        required: true,
                        channel_types: [0, 5]
                    },
                    {
                        name: "winers",
                        name_localizations: getLocalizations("giveaway.options.0.options.3.name"),
                        description: "Amount of winners",
                        description_localizations: getLocalizations("giveaway.options.0.options.3.description"),
                        type: ApplicationCommandOptionType.Integer,
                        max_value: 250,
                        min_value: 1,
                        required: true
                    },
                    {
                        name: "requires",
                        name_localizations: getLocalizations("giveaway.options.0.options.4.name"),
                        description: "What are the requirements for this giveaway?",
                        description_localizations: getLocalizations("giveaway.options.0.options.4.description"),
                        max_length: 1024,
                        type: ApplicationCommandOptionType.String,
                    },
                    {
                        name: "imageurl",
                        name_localizations: getLocalizations("giveaway.options.0.options.5.name"),
                        description: "An URL from an image to show in giveaway",
                        description_localizations: getLocalizations("giveaway.options.0.options.5.description"),
                        type: ApplicationCommandOptionType.String,
                    },
                    {
                        name: "color",
                        name_localizations: getLocalizations("giveaway.options.0.options.6.name"),
                        description: "The embed's colors",
                        description_localizations: getLocalizations("giveaway.options.0.options.6.description"),
                        type: ApplicationCommandOptionType.String,
                        autocomplete: true
                    },
                    {
                        name: "sponsor",
                        name_localizations: getLocalizations("giveaway.options.0.options.7.name"),
                        description: "Who's the sponsor?",
                        description_localizations: getLocalizations("giveaway.options.0.options.7.description"),
                        type: ApplicationCommandOptionType.User,
                        autocomplete: true
                    },
                    {
                        name: "account_days",
                        name_localizations: getLocalizations("giveaway.options.0.options.8.name"),
                        description: "Minimum number of days with the created account",
                        description_localizations: getLocalizations("giveaway.options.0.options.8.description"),
                        type: ApplicationCommandOptionType.Integer,
                        autocomplete: true,
                        min_value: 0
                    },
                    {
                        name: "server_days",
                        name_localizations: getLocalizations("giveaway.options.0.options.9.name"),
                        description: "Minimum number of days within the server",
                        description_localizations: getLocalizations("giveaway.options.0.options.9.description"),
                        type: ApplicationCommandOptionType.Integer,
                        autocomplete: true,
                        min_value: 0
                    }
                ]
            },
            {
                name: "list",
                name_localizations: getLocalizations("giveaway.options.1.name"),
                description: "[moderation] A list with all giveaways",
                description_localizations: getLocalizations("giveaway.options.1.description"),
                type: 1
            },
            {
                name: "reroll",
                name_localizations: getLocalizations("giveaway.options.2.name"),
                description: "[moderation] Reroll a giveaway",
                description_localizations: getLocalizations("giveaway.options.2.description"),
                type: 1,
                options: [
                    {
                        name: "id",
                        name_localizations: getLocalizations("giveaway.options.2.options.0.name"),
                        description: "The giveaway's ID (The giveaway's message ID)",
                        description_localizations: getLocalizations("giveaway.options.2.options.0.name"),
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: "winners",
                        name_localizations: getLocalizations("giveaway.options.2.options.1.name"),
                        description: "Amount of winners to reroll (1 ~ 250)",
                        description_localizations: getLocalizations("giveaway.options.2.options.1.description"),
                        type: ApplicationCommandOptionType.Integer,
                        min_value: 1,
                        max_value: 250,
                        required: true
                    }
                ]
            },
            // {
            //     name: 'options',
            //     name_localizations: { "en-US": "options", 'pt-BR': 'opções' },
            //     description: '[moderation] Opções e funções adicionais',
            //     type: 1,
            //     options: [
            //         {
            //             name: 'method',
            //             name_localizations: { "en-US": "method", 'pt-BR': 'função' },
            //             description: 'Escolha o método a ser utilizado',
            //             type: 3,
            //             required: true,
            //             choices: [
            //                 {
            //                     name: 'Deletar',
            //                     value: 'delete'
            //                 },
            //                 {
            //                     name: 'Resetar',
            //                     value: 'reset'
            //                 },
            //                 {
            //                     name: 'Forçar Finalização',
            //                     value: 'finish'
            //                 },
            //                 {
            //                     name: 'Ver Informações',
            //                     value: 'info'
            //                 }
            //             ]
            //         },
            //         {
            //             name: 'select_giveaway',
            //             name_localizations: { "en-US": "select_giveaway", 'pt-BR': 'selecionar_sorteio' },
            //             description: 'Selecione o sorteio relacionado',
            //             type: 3,
            //             required: true,
            //             autocomplete: true
            //         }
            //     ]
            // }
        ]
    },
    additional: {
        category: "",
        admin: false,
        staff: false,
        api_data: {
            name: "",
            description: "",
            category: "",
            synonyms: [""],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {
            return await interaction.reply({
                content: t("keyword_loading", interaction.userLocale)
            });
        }
    }
};