import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import sequency from "../../functions/memory/sequency/sequency";
import solo from "../../functions/memory/solo/solo";
import cooperative from "../../functions/memory/cooperative/cooperative";
import versus from "../../functions/memory/versus/versus";

const choices = [
    {
        name: "Numbers (Easy)",
        name_localizations: getLocalizations("memory.choices.0"),
        value: 0
    },
    {
        name: "Animals (Easy)",
        name_localizations: getLocalizations("memory.choices.1"),
        value: 2
    },
    {
        name: "Fruits (Easy)",
        name_localizations: getLocalizations("memory.choices.2"),
        value: 3
    },
    {
        name: "Balls (Easy)",
        name_localizations: getLocalizations("memory.choices.3"),
        value: 4
    },
    {
        name: "Hearts (Easy)",
        name_localizations: getLocalizations("memory.choices.4"),
        value: 6
    },
    {
        name: "Flags (Medium)",
        name_localizations: getLocalizations("memory.choices.5"),
        value: 1
    },
    {
        name: "Emojis (Medium)",
        name_localizations: getLocalizations("memory.choices.6"),
        value: 5
    },
    {
        name: "Arrows (Medium)",
        name_localizations: getLocalizations("memory.choices.7"),
        value: 10
    },
    {
        name: "Moons (Medium)",
        name_localizations: getLocalizations("memory.choices.8"),
        value: 11
    },
    {
        name: "Clocks (Hard)",
        name_localizations: getLocalizations("memory.choices.9"),
        value: 7
    },
    {
        name: "Blue Flags (Hard)",
        name_localizations: getLocalizations("memory.choices.10"),
        value: 9
    },
    {
        name: "Family (Ultimate)",
        name_localizations: getLocalizations("memory.choices.11"),
        value: 8
    }
];

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
        name: "memory",
        name_localizations: getLocalizations("memory.name"),
        description: "[game] Just a game to you test your memory",
        description_localizations: getLocalizations("memory.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "yourself",
                name_localizations: getLocalizations("memory.options.0.name"),
                description: "[games] Play by yourself",
                description_localizations: getLocalizations("memory.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "emojis",
                        name_localizations: getLocalizations("memory.options.0.options.0.name"),
                        description: "Choose an emojis",
                        description_localizations: getLocalizations("memory.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.Integer,
                        choices
                    },
                    {
                        name: "mode",
                        name_localizations: getLocalizations("memory.options.0.options.1.name"),
                        description: "Choose a game mode",
                        description_localizations: getLocalizations("memory.options.0.options.1.description"),
                        type: ApplicationCommandOptionType.String,
                        choices: [
                            {
                                name: "Run time (2 minutes)",
                                name_localizations: getLocalizations("memory.options.0.options.1.choices.0"),
                                value: "minutes"
                            }
                        ]
                    }
                ]
            },
            {
                name: "cooperative",
                name_localizations: getLocalizations("memory.options.1.name"),
                description: "[games] Play with someone in a coop mode",
                description_localizations: getLocalizations("memory.options.1.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "member",
                        name_localizations: getLocalizations("memory.options.1.options.0.name"),
                        description: "Select a member",
                        description_localizations: getLocalizations("memory.options.1.options.0.description"),
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: "emojis",
                        name_localizations: getLocalizations("memory.options.1.options.1.name"),
                        description: "Choose an emojis",
                        description_localizations: getLocalizations("memory.options.1.options.1.description"),
                        type: ApplicationCommandOptionType.Integer,
                        choices
                    },
                ]
            },
            {
                name: "versus",
                name_localizations: getLocalizations("memory.options.2.name"),
                description: "[games] A classic 1x1 mode",
                description_localizations: getLocalizations("memory.options.2.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "member",
                        name_localizations: getLocalizations("memory.options.2.options.0.name"),
                        description: "Select a member",
                        description_localizations: getLocalizations("memory.options.2.options.0.description"),
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: "emojis",
                        name_localizations: getLocalizations("memory.options.2.options.1.name"),
                        description: "Select the emoji class",
                        description_localizations: getLocalizations("memory.options.2.options.1.description"),
                        type: ApplicationCommandOptionType.Integer,
                        choices
                    }
                ]
            },
            {
                name: "sequency",
                name_localizations: getLocalizations("memory.options.3.name"),
                description: "[games] Are you able to follow the correct sequence?",
                description_localizations: getLocalizations("memory.options.3.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "numbers",
                        name_localizations: getLocalizations("memory.options.3.options.0.name"),
                        description: "How much number do you want?",
                        description_localizations: getLocalizations("memory.options.3.options.0.description"),
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        choices: [
                            {
                                name: "5 Numbers",
                                name_localizations: getLocalizations("memory.options.3.options.0.choices.0"),
                                value: 5
                            },
                            {
                                name: "6 Numbers",
                                name_localizations: getLocalizations("memory.options.3.options.0.choices.1"),
                                value: 6
                            },
                            {
                                name: "7 Numbers",
                                name_localizations: getLocalizations("memory.options.3.options.0.choices.2"),
                                value: 7
                            },
                            {
                                name: "8 Numbers",
                                name_localizations: getLocalizations("memory.options.3.options.0.choices.3"),
                                value: 8
                            },
                            {
                                name: "9 Numbers",
                                name_localizations: getLocalizations("memory.options.3.options.0.choices.4"),
                                value: 9
                            },
                            {
                                name: "10 Numbers",
                                name_localizations: getLocalizations("memory.options.3.options.0.choices.5"),
                                value: 10
                            }
                        ]
                    }
                ]
            }
        ]
    },
    additional: {
        category: "games",
        admin: false,
        staff: false,
        api_data: {
            name: "memoria",
            description: "Um simples jogo de memória",
            category: "Diversão",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("memory.name") || {}
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

            const gameMode = options.getSubcommand();
            if (gameMode === "yourself") return await solo(interaction);
            if (gameMode === "cooperative") return await cooperative(interaction);
            if (gameMode === "versus") return await versus(interaction);
            if (gameMode === "sequency") return await sequency(interaction, options.getInteger("numbers") || 0);

            return await interaction.reply({ content: "Not Found #61251584#" });
        }
    }
};