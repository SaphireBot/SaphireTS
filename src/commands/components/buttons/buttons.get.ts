import { ButtonStyle, ComponentType, LocaleString } from "discord.js";
import { t } from "../../../translator";
import { BaseMessageOptionsComponent } from "../../../@types/commands";
import { e } from "../../../util/json";
import { urls } from "../../../util/constants";

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

export function getSetPrefixButtons(userId: string, locale: LocaleString | undefined): BaseMessageOptionsComponent[] {
    return [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("keyword_configure", locale),
                    emoji: e.Commands.emoji(),
                    custom_id: JSON.stringify({ c: "prefix", uid: userId }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: t("keyword_reset", locale),
                    emoji: "🧹".emoji(),
                    custom_id: JSON.stringify({ c: "prefix", uid: userId, src: "refresh" }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: t("keyword_cancel", locale),
                    emoji: e.Trash.emoji(),
                    custom_id: JSON.stringify({ c: "delete", uid: userId }),
                    style: ButtonStyle.Danger
                },
                {
                    type: 2,
                    label: t("keyword_commands", locale),
                    emoji: "🔎".emoji(),
                    url: urls.saphireSiteUrl + "/commands",
                    style: ButtonStyle.Link
                }
            ]
        }
    ];
}