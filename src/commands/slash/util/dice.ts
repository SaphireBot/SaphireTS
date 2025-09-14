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
        name: "dice",
        name_localizations: getLocalizations("dice.name"),
        description: "Get some random nice from a dice",
        description_localizations: getLocalizations("dice.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "number_of_dices",
                name_localizations: getLocalizations("dice.options.0.name"),
                description: "Number of dices",
                description_localizations: getLocalizations("dice.options.0.description"),
                type: ApplicationCommandOptionType.Integer,
                max_value: 2000,
                min_value: 1,
            },
        ],
    },
    additional: {
        category: "",
        admin: false,
        staff: false,
        api_data: {
            name: "dado",
            description: "Obtenha algum número aleatório de um dado",
            category: "Utilidades",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("dice.name") || {},
                    ),
                ),
            ),
            tags: [],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options } = interaction;
            const number_of_dices = options.getInteger("number_of_dices") || 1;
            let result = 0;

            for (let i = 0; i < number_of_dices; i++)
                result += dice();

            return await interaction.reply({ content: `${e.dice} | \`${result}\`` });

            function dice() {
                return Math.floor(Math.random() * 6) + 1;
            }
        },
    },
};