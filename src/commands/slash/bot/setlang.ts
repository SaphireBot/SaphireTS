import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, LocaleString } from "discord.js";
import { e } from "../../../util/json";
import client from "../../../saphire/index";
import { t } from "../../../translator";
import Database from "../../../database";
import { locales } from "../../../@prototypes/User";
import { getSetLangButtons } from "../../components/buttons/buttons.get";
import { getLocalizations } from "../../../util/getlocalizations";
import { Config } from "../../../util/constants";

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
        name_localizations: getLocalizations("setlang.name"),
        description: "[util] Set the language of your choice.",
        description_localizations: getLocalizations("setlang.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "lang",
                name_localizations: getLocalizations("setlang.options.0.name"),
                description: "Available languages",
                description_localizations: getLocalizations("setlang.options.0.description"),
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
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "setlang",
            description: "Configure um idioma personalizado",
            category: "Utilidades",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const lang = interaction.options.getString("lang") as LocaleString | undefined;

            if (!lang || !Config.locales.includes(lang))
                return await interaction.reply({
                    content: `${e.Animated.SaphireReading} | ${t("setlang.default_message_options", interaction.userLocale)}`,
                    components: getSetLangButtons(interaction.user.id, interaction.userLocale)
                });

            await interaction.reply({ content: `${e.Loading} | ${t("keyword_loading", lang)}` });

            await Database.Users.updateOne(
                { id: interaction.user.id },
                { $set: { locale: lang } },
                { upsert: true }
            );
            locales.set(interaction.user.id, lang);

            return await interaction.editReply({ content: t("setlang.success_change", { locale: lang, e }) });
        }
    }
};