import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { Battleroyale, channelsInGame } from "../../../structures/battleroyale/battleroyale";
import { t } from "../../../translator";
import battlaroyaleRanking, { rankingKeys } from "../../functions/battleroyale/ranking";

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
        name: "battleroyale",
        // name_localizations: getLocalizations("battleroyale.name"),
        description: "[game] Join into the arena and fight for your life",
        description_localizations: getLocalizations("battleroyale.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "ranking",
                name_localizations: getLocalizations("battleroyale.options.0.name"),
                type: ApplicationCommandOptionType.String,
                description: "See the global ranking of this game",
                description_localizations: getLocalizations("battleroyale.options.0.description"),
                choices: [
                    {
                        name: "Death's Ranking",
                        name_localizations: getLocalizations("battleroyale.options.0.choices.0"),
                        value: "deaths"
                    },
                    {
                        name: "Assassins's Ranking",
                        name_localizations: getLocalizations("battleroyale.options.0.choices.1"),
                        value: "kills"
                    },
                    {
                        name: "Matches's Ranking",
                        name_localizations: getLocalizations("battleroyale.options.0.choices.2"),
                        value: "matches"
                    },
                    {
                        name: "Victorious's Ranking",
                        name_localizations: getLocalizations("battleroyale.options.0.choices.3"),
                        value: "wins"
                    },
                    {
                        name: "My Personal Informations",
                        name_localizations: getLocalizations("battleroyale.options.0.choices.4"),
                        value: "me"
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
            name: "battleroyale",
            description: "Entre na Arena e lute por sua vida!",
            category: "Jogos",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { channelId, userLocale, options } = interaction;
            const rankingKey = options.getString("ranking") as rankingKeys;
            if (rankingKey) return await battlaroyaleRanking(interaction, rankingKey);

            if (channelsInGame.has(channelId))
                return await interaction.reply({
                    content: t("battleroyale.a_party_in_running", { e, locale: userLocale })
                })
                    .then(msg => setTimeout(() => msg.delete().catch(() => { }), 1000 * 5));

            return new Battleroyale(interaction).load();
        }
    }
};