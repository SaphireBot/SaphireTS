import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { AfkManager } from "../../../managers";
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
        name: "afk",
        description: "[util] Set a alert and I'll send a message to you",
        description_localizations: getLocalizations("afk.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "message",
                name_localizations: getLocalizations("afk.options.0.name"),
                description: "A message that will be shown to everyone who mentions you",
                description_localizations: getLocalizations("afk.options.0.description"),
                type: ApplicationCommandOptionType.String,
                max_length: 500
            },
            {
                name: "type",
                name_localizations: getLocalizations("afk.options.1.name"),
                description: "The AFK type",
                description_localizations: getLocalizations("afk.options.1.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Only in this server",
                        name_localizations: getLocalizations("afk.options.1.choices.0"),
                        value: "guild"
                    },
                    {
                        name: "On all servers (I must be on the server to send the alert)",
                        name_localizations: getLocalizations("afk.options.1.choices.1"),
                        value: "global"
                    }
                ]
            }
        ]
    },
    additional: {
        category: "util",
        admin: false,
        staff: false,
        api_data: {
            name: "afk",
            description: "Configure uma mensagem para ser emitada quando te mencionarem",
            category: "Utilidades",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const { userLocale: locale, guild, options, user } = interaction;
            const message = options.getString("message") || "";
            const type = options.getString("type") || guild ? "guild" : "global";

            await interaction.reply({ content: t("afk.loading", { e, locale }), ephemeral: true });
            const response = await AfkManager.set(user.id, message, guild?.id, type);

            return await interaction.editReply({
                content: t(
                    response ? "afk.success" : "afk.fail",
                    { e, locale, message: message?.length ? `\n📝 | ${message}` : "" })
            });
        }
    }
};