import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, LocaleString } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire/index";
import { t } from "../../../translator";
import Database from "../../../database";
import { languages } from "../../../@prototypes/User";
import { getSetLangButtons } from "../../components/buttons/setlang/buttons.get";

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
        name: "setlang",
        name_localizations: {
            "en-US": "setlang",
            "es-ES": "idioma",
            "fr": "langue",
            "ja": "言語",
            "pt-BR": "idioma"
        },
        description: "[util] Configure o idioma de sua escolha.",
        description_localizations: {
            "en-US": "Set the language of your choice.",
            "es-ES": "Configure el idioma de su elección.",
            "fr": "Configurez la langue de votre choix.",
            "ja": "選択した言語を設定してください。",
            "pt-BR": "Configure o idioma de sua escolha."
        },
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "lang",
                name_localizations: {
                    "en-US": "language",
                    "es-ES": "idioma",
                    "fr": "langue",
                    "ja": "言語",
                    "pt-BR": "idioma"
                },
                description: "Idiomas disponíveis",
                description_localizations: {
                    "en-US": "Available languages",
                    "es-ES": "Idiomas disponibles",
                    "fr": "Langues disponibles",
                    "ja": "利用可能な言語",
                    "pt-BR": "Idiomas disponíveis"
                },
                choices: [
                    {
                        name: "English",
                        value: "en-US"
                    },
                    {
                        name: "Español",
                        value: "es-ES"
                    },
                    {
                        name: "Français",
                        value: "fr"
                    },
                    {
                        name: "日本語",
                        value: "ja"
                    },
                    {
                        name: "Português",
                        value: "pt-BR"
                    },
                ]
            }
        ]
    },
    additional: {
        database: false,
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "setlang",
            description: "Configure um idioma personalizado",
            category: "Utilidades",
            synonyms: ["setlang", "idioma", "langue", "言語", "idioma"],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const lang = interaction.options.getString("lang") as LocaleString | undefined;

            if (!lang || !["en-US", "es-ES", "fr", "ja", "pt-BR"].includes(lang))
                return await interaction.reply({
                    content: `${e.DenyX} | ${t("setlang.language_not_found", interaction.userLocale)}`,
                    components: getSetLangButtons(interaction.user.id, interaction.userLocale)
                });

            await interaction.reply({ content: `${e.Loading} | ${t("keyword_loading", lang)}` });

            await Database.Users.updateOne(
                { id: interaction.user.id },
                { $set: { locale: lang } }
            );
            languages.set(interaction.user.id, lang);

            return await interaction.editReply({ content: `${e.CheckV} | ${t("setlang.success_change", lang)}` });
        }
    }
};