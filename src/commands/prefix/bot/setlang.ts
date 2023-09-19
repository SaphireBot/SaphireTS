import { LocaleString, Message } from "discord.js";
import { e } from "../../../util/json";
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
    name: "setlang",
    description: "Escolha um idioma da sua escolha",
    aliases: ["lang", "idioma", "langue", "言語", "idioma"],
    category: "bot",
    api_data: {
        category: "Utilidades",
        synonyms: ["idioma", "langue", "言語", "idioma"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {

        if (!args || !args[0])
            return await message.reply({
                content: `${e.Animated.SaphireReading} | ${t("setlang.default_message_options", message.userLocale)}`,
                components: getSetLangButtons(message.author.id, message.userLocale)
            });

        const lang = {
            "en-us": "en-US",
            "english": "en-US",
            "en": "en-US",
            "usa": "en-US",
            "inglés": "en-US",
            "anglais": "en-US",
            "英語": "en-US",

            "es-es": "es-ES",
            "spanish": "es-ES",
            "es": "es-ES",
            "espanhol": "es-ES",
            "español": "es-ES",
            "espagnol": "es-ES",
            "スペイン語": "es-ES",

            "fr": "fr",
            "french": "fr",
            "francés": "fr",
            "francês": "fr",
            "frances": "fr",
            "français": "fr",
            "フランス語": "fr",

            "ja": "ja",
            "japanese": "ja",
            "japones": "ja",
            "japonês": "ja",
            "japonés": "ja",
            "japonais": "ja",
            "日本語": "ja",

            "pt-br": "pt-BR",
            "portugues": "pt-BR",
            "pt": "pt-BR",
            "br": "pt-BR",
            "português": "pt-BR",
            "portuguese": "pt-BR",
            "portugués": "pt-BR",
            "portugais": "pt-BR",
            "「ポルトガル語": "pt-BR",
        }[args[0].toLowerCase()] as LocaleString | undefined;

        if (!lang || !["en-US", "es-ES", "fr", "ja", "pt-BR"].includes(lang))
            return await message.reply({
                content: `${e.Animated.SaphireReading} | ${t("setlang.default_message_options", message.userLocale)}`,
                components: getSetLangButtons(message.author.id, message.userLocale)
            });

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", lang)}` });

        await Database.Users.updateOne(
            { id: message.author.id },
            { $set: { locale: lang } }
        );
        languages.set(message.author.id, lang);

        await msg.edit({ content: `${e.CheckV} | ${t("setlang.success_change", lang)}` })
            .catch(async () => await message.channel.send({ content: `${e.CheckV} | ${message.author.toString()}, ${t("setlang.success_change", lang)}` }).catch(() => { }));
        return;
    }

};