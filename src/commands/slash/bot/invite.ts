import { ApplicationCommandType, ChatInputCommandInteraction, Colors } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { t } from "../../../translator";
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
        name: "invite",
        name_localizations: getLocalizations("invite.name"),
        description: "[bot] Invite me to your server",
        description_localizations: getLocalizations("invite.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: []
    },
    additional: {
        database: false,
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "ping",
            description: "Veja um resumo de todas as conexões da Saphire",
            category: "Saphire",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        execute: async function (interaction: ChatInputCommandInteraction) {
            return await interaction.reply({
                embeds: [{
                    color: Colors.LightGrey,
                    description: `${e.Animated.SaphireDance} | ${t("invite_message_embeds.0.description", { locale: interaction.userLocale, link: client.invite })}`
                }]
            });
        }
    }
};