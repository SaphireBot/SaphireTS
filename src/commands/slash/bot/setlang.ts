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
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "language",
                name_localizations: getLocalizations("setlang.options.0.name"),
                description: "Available languages",
                description_localizations: getLocalizations("setlang.options.0.description"),
                autocomplete: true
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

            const lang = interaction.options.getString("language") as LocaleString | undefined;

            if (!lang || !Config.locales.includes(lang))
                return await interaction.reply({
                    content: t("setlang.default_message_options", {
                        locale: interaction.userLocale,
                        e,
                        langs: Object.entries(Config.localesKeyword)
                            .map(([key, lang]) => `**${t(`keyword_language.${lang}`, interaction.userLocale)} (\`${key}\`)**`)
                            .join(", ")
                    }),
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