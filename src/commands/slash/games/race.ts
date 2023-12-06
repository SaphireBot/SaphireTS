import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import Race, { channelsInGane } from "../../functions/race";
import { t } from "../../../translator";

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    data: {
        type: ApplicationCommandType.ChatInput,
        application_id: client.user!.id,
        guild_id: "",
        name: "race",
        name_localizations: getLocalizations("race.name"),
        description: "Race with animals and google luck",
        description_localizations: getLocalizations("race.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "players",
                name_localizations: getLocalizations("race.options.0.name"),
                description: "Bet some Sapphires with another players",
                description_localizations: getLocalizations("race.options.0.description"),
                type: ApplicationCommandOptionType.Integer,
                max_value: 20,
                min_value: 1
            },
            {
                name: "distance",
                name_localizations: getLocalizations("race.options.1.name"),
                description: "The distance to be covered",
                description_localizations: getLocalizations("race.options.1.description"),
                type: ApplicationCommandOptionType.Integer,
                max_value: 20,
                min_value: 1
            },
            {
                name: "value",
                name_localizations: getLocalizations("race.options.2.name"),
                description: "Bet some Sapphires with another players",
                description_localizations: getLocalizations("race.options.2.description"),
                type: ApplicationCommandOptionType.Integer,
                min_value: 1
            },
            {
                name: "language",
                name_localizations: getLocalizations("setlang.options.0.name"),
                description: "Available languages to this command",
                description_localizations: getLocalizations("setlang.options.0.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "English",
                        name_localizations: getLocalizations("setlang.options.0.choices.0.name"),
                        value: "en-US"
                    },
                    {
                        name: "Español",
                        name_localizations: getLocalizations("setlang.options.0.choices.1.name"),
                        value: "es-ES"
                    },
                    {
                        name: "Français",
                        name_localizations: getLocalizations("setlang.options.0.choices.2.name"),
                        value: "fr"
                    },
                    {
                        name: "Japanese",
                        name_localizations: getLocalizations("setlang.options.0.choices.3.name"),
                        value: "ja"
                    },
                    {
                        name: "Portuguese",
                        name_localizations: getLocalizations("setlang.options.0.choices.4.name"),
                        value: "pt-BR"
                    },
                    {
                        name: "German",
                        name_localizations: getLocalizations("setlang.options.0.choices.5.name"),
                        value: "de"
                    },
                    {
                        name: "Chinese",
                        name_localizations: getLocalizations("setlang.options.0.choices.6.name"),
                        value: "zh-CN"
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
            name: "race",
            description: "Aposte corrida com outras pessoas",
            category: "Jogos",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("race.name") || {}
                    )
                )
            ),
            tags: ["new"],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {
            if (channelsInGane.has(interaction.channelId))
                return await interaction.reply({
                    content: t("race.has_a_game_in_this_channel", { e, locale: interaction.userLocale }),
                    ephemeral: true
                });

            return new Race(interaction).load();
        }
    }
};