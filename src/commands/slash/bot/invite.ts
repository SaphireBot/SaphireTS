import { ApplicationCommandType, ChatInputCommandInteraction, Colors } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire/index";
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
        name: "invite",
        name_localizations: {
            // "en-US": "[bot] Invite me to your server",
            "es-ES": "invitar",
            "fr": "inviter",
            "ja": "招待",
            "pt-BR": "convidar"
        },
        description: "[bot] Invite me to your server",
        description_localizations: {
            // "en-US": "[bot] Invite me to your server",
            "es-ES": "[bot] Invítame a tu servidor",
            "fr": "[bot] Invitez-moi dans votre serveur",
            "ja": "[bot] 私をあなたのサーバーに招待してください",
            "pt-BR": "[bot] Me convide para o seu servidor"
        },
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
                    description: `${e.Animated.SaphireDance} | ${t("invite_message_embeds.0.description", { locale: interaction.userLocale, link: `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&scope=bot%20applications.commands&permissions=2146958847` })}`
                }]
            });
        }
    }
};