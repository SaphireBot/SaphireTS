import { LocaleString, Message } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import { locales } from "../../../@prototypes/User";
import { getSetLangButtons } from "../../components/buttons/buttons.get";
import { Config, KeyOfLanguages } from "../../../util/constants";
const aliases = ["lang", "idioma", "langue", "言語", "sprache", "language"];

/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object
 * https://discord.com/developers/docs/reference#locales
 * "id" and "version" not used here
 */
export default {
    name: "setlang",
    description: "Escolha um idioma da sua escolha",
    aliases,
    category: "bot",
    api_data: {
        category: "Utilidades",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message, args: string[] | undefined) {

        if (!args || !args[0])
            return await message.reply({
                content: t("setlang.default_message_options", {
                    locale: message.userLocale,
                    e,
                    langs: Object.entries(Config.localesKeyword)
                        .map(([key, lang]) => `**${t(`keyword_language.${lang}`, message.userLocale)} (\`${key}\`)**`)
                        .join(", ")
                }),
                components: getSetLangButtons(message.author.id, message.userLocale)
            });

        const lang = KeyOfLanguages[args[0].toLowerCase() as keyof typeof KeyOfLanguages] as LocaleString | undefined;

        if (!lang || !Config.locales.includes(lang))
            return await message.reply({
                content: `${e.Animated.SaphireReading} | ${t("setlang.default_message_options", message.userLocale)}`,
                components: getSetLangButtons(message.author.id, message.userLocale)
            });

        const msg = await message.reply({ content: `${e.Loading} | ${t("keyword_loading", lang)}` });

        await Database.Users.updateOne(
            { id: message.author.id },
            { $set: { locale: lang } }
        );
        locales.set(message.author.id, lang);

        return await msg.edit({ content: t("setlang.success_change", { locale: lang, e }) })
            .catch(async () => await message.channel.send({ content: `${e.CheckV} | ${message.author.toString()}, ${t("setlang.success_change", { locale: lang, e })}` })
                .catch(() => { }));

    }

};