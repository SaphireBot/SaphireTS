import { ButtonStyle, ComponentType, LocaleString } from "discord.js";
import { t } from "../../../../translator";
import { BaseMessageOptionsComponent } from "../../../../@types/commands";

export function getSetLangButtons(userId: string, locale: LocaleString | undefined): BaseMessageOptionsComponent[] {

    return [
        {
            type: ComponentType.ActionRow,
            components: [
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.portuguese", locale),
                    emoji: "🇧🇷".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "pt-BR" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "pt-BR"
                },
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.english", locale),
                    emoji: "🇺🇸".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "en-US" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "en-US"
                },
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.spanish", locale),
                    emoji: "🇪🇸".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "es-ES" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "es-ES"
                },
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.french", locale),
                    emoji: "🇫🇷".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "fr" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "fr"
                },
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.japanese", locale),
                    emoji: "🇯🇵".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "ja" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "ja"
                }
            ]
        },
        {
            type: ComponentType.ActionRow,
            components: [
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.german", locale),
                    emoji: "🇩🇪".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "de" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "de"
                }
            ]
        }
    ];

}