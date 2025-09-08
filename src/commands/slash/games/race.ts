import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import Race from "../../functions/race";
import { t } from "../../../translator";
import { ChannelsInGame } from "../../../util/constants";

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
                description: "Limit of players in this party (1~20)",
                description_localizations: getLocalizations("race.options.0.description"),
                type: ApplicationCommandOptionType.Integer,
                max_value: 20,
                min_value: 1,
            },
            {
                name: "distance",
                name_localizations: getLocalizations("race.options.1.name"),
                description: "The distance to be covered (1.0~10.0)",
                description_localizations: getLocalizations("race.options.1.description"),
                type: ApplicationCommandOptionType.Integer,
                max_value: 10,
                min_value: 1,
            },
            {
                name: "value",
                name_localizations: getLocalizations("race.options.2.name"),
                description: "Bet some Sapphires with another players",
                description_localizations: getLocalizations("race.options.2.description"),
                type: ApplicationCommandOptionType.String,
                min_value: 1,
            },
            {
                name: "language",
                name_localizations: getLocalizations("setlang.options.0.name"),
                description: "Available languages to this command",
                description_localizations: getLocalizations("setlang.options.0.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
            },
        ],
    },
    additional: {
        category: "games",
        admin: false,
        staff: false,
        api_data: {
            name: "race",
            description: "Aposte corrida com outras pessoas",
            category: "Diversão",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("race.name") || {},
                    ),
                ),
            ),
            tags: ["new"],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            if (ChannelsInGame.has(interaction.channelId))
                return await interaction.reply({
                    content: t("race.has_a_game_in_this_channel", { e, locale: interaction.userLocale }),
                    flags: [MessageFlags.Ephemeral],
                });

            return await new Race(interaction).load();
        },
    },
};