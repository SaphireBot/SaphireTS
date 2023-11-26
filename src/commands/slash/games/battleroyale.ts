import { ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import BattleRoyale from "../../functions/battleroyale";

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
        description: "[games] Play with some people to be the winner!",
        description_localizations: getLocalizations("battleroyale.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: []
    },
    additional: {
        category: "games",
        admin: false,
        staff: false,
        api_data: {
            name: "battleroyale",
            description: "Jogue com outras pessoas e seja o vencedor",
            category: "Diversão",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        execute: async (interaction: ChatInputCommandInteraction<"cached">) => await new BattleRoyale(interaction).load()
    }
};