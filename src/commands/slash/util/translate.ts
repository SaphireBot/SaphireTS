import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { languages } from "../../prefix/util/translate/constants.translate";
import translate, { isSupported } from "google-translate-api-x";
import { t } from "../../../translator";
import successTranslate from "../../prefix/util/translate/success.translate";

type langsKeyof = keyof typeof languages;

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
        name: "translate",
        name_localizations: getLocalizations("translate.name"),
        description: "[util] Translate a text to another language",
        description_localizations: getLocalizations("translate.description"),
        default_member_permissions: undefined,
        dm_permission: true,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "to",
                name_localizations: getLocalizations("translate.options.0.name"),
                description: "What language the text should be translate?",
                description_localizations: getLocalizations("translate.options.0.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true,
            },
            {
                name: "text",
                name_localizations: getLocalizations("translate.options.1.name"),
                description: "Text to translate",
                description_localizations: getLocalizations("translate.options.1.description"),
                type: ApplicationCommandOptionType.String,
                max_length: 5000,
                required: true,
            },
            {
                name: "from",
                name_localizations: getLocalizations("translate.options.2.name"),
                description: "The text language",
                description_localizations: getLocalizations("translate.options.2.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
            },
        ],
    },
    additional: {
        category: "util",
        admin: false,
        staff: false,
        api_data: {
            name: "translate",
            description: "Traduza textos para outro idioma",
            category: "Utilidades",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("translate.name") || {},
                    ),
                ),
            ),
            tags: [],
            perms: {
                user: [],
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const { userLocale: locale, options } = interaction;

            const to = languages[options.getString("to") as langsKeyof | undefined || locale as langsKeyof];
            const from: string | undefined = languages[options.getString("from") as langsKeyof];

            if (
                !isSupported(to)
                || (from && !isSupported(from))
            ) {
                return await interaction.reply({
                    content: t("translate.not_supported_iso", { e, locale }),
                    flags: [MessageFlags.Ephemeral],
                });
            }

            const text = options.getString("text")!;

            if (text.length > 5000)
                return await interaction.reply({
                    content: t("translate.over_limit", { e, locale }),
                    flags: [MessageFlags.Ephemeral],
                });

            await interaction.reply({
                content: t("translate.translating", { e, locale }),
            });

            const params: { to: string, autoCorrect: boolean, from?: string | undefined } = { to, autoCorrect: true };
            if (from) params.from = from;

            return await translate(text, params)
                .then(async res => await successTranslate(res, undefined, undefined, undefined, interaction))
                .catch(async (err: Error) => {
                    const content = t("translate.error", { locale, e, error: err?.message || err });
                    return await interaction.editReply(content).catch(console.log);
                });
        },
    },
};