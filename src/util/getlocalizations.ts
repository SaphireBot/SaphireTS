import { Locale } from "discord.js";
import { t } from "../translator";
const LOCALES = Object.values(Locale);

export function getLocalizations(
    key: string,
    options?: Record<string, any>,
): Partial<Record<Locale, string | null>> {
    return LOCALES.reduce((acc, locale) => {
        const translation = t(key, Object.assign({
            locale,
            capitalize: null,
            translation: {
                noScape: true,
            },
        }, options));

        if (!translation) return acc;

        acc[locale] = translation.slice(0, 100);

        return acc;
    }, <Record<Locale, string>>{});
}