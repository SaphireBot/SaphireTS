import { ButtonStyle, ComponentType, LocaleString, parseEmoji } from "discord.js";
import { t } from "../../../translator";
import { BaseMessageOptionsComponent } from "../../../@types/commands";
import { e } from "../../../util/json";
import { urls } from "../../../util/constants";

export function getSetLangButtons(userId: string, locale: LocaleString): BaseMessageOptionsComponent[] {
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
                },
                {
                    type: ComponentType.Button,
                    label: t("keyword_language.chinese", locale),
                    emoji: "🇨🇳".emoji(),
                    custom_id: JSON.stringify({ c: "lang", uid: userId, lang: "zh-CN" }),
                    style: ButtonStyle.Primary,
                    disabled: locale === "zh-CN"
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

export function getPaginationButtons() {
    return [{
        type: 1,
        components: [
            {
                type: 2,
                emoji: parseEmoji("⏪"),
                custom_id: "zero",
                style: ButtonStyle.Primary
            },
            {
                type: 2,
                emoji: parseEmoji("◀️"),
                custom_id: "left",
                style: ButtonStyle.Primary
            },
            {
                type: 2,
                emoji: parseEmoji("▶️"),
                custom_id: "right",
                style: ButtonStyle.Primary
            },
            {
                type: 2,
                emoji: parseEmoji("⏩"),
                custom_id: "last",
                style: ButtonStyle.Primary
            },
        ]
    }].asMessageComponents();
}

export function avatarSelectMenu(customId: string, placeholder: string, options: { label: string, emoji?: string, description?: string, value: string }[]) {

    if (
        typeof customId !== "string"
        || typeof placeholder !== "string"
        || !Array.isArray(options)
    ) return [];

    if (options?.length > 25)
        options.length = 25;

    return [{
        type: 1,
        components: [{
            type: 3,
            custom_id: customId.limit("CustomId"),
            placeholder: placeholder.limit("SelectMenuPlaceholder"),
            options
        }]
    }];
}

export function tempcallOptions(data: { enable: boolean, muteTime: boolean }, locale: string) {
    return [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: data.enable ? t("keyword_enable", locale) : t("keyword_disable", locale),
                    emoji: data.enable ? e.CheckV : e.DenyX,
                    custom_id: JSON.stringify({ c: "tempcall", src: data.enable ? "disable" : "enable" }),
                    style: data.enable ? ButtonStyle.Success : ButtonStyle.Secondary
                },
                {
                    type: 2,
                    label: data.muteTime ? t("tempcall.save_muted_time", locale) : t("tempcall.ignore_muted_time", locale),
                    emoji: data.muteTime ? e.CheckV : e.DenyX,
                    custom_id: JSON.stringify({ c: "tempcall", src: "muted" }),
                    style: data.muteTime ? ButtonStyle.Success : ButtonStyle.Secondary,
                    disabled: !data.enable
                }
            ]
        }
    ].asMessageComponents();
}

export function getConfirmationButton(locale: LocaleString, customId?: { accept: string, cancel: string }) {
    return [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("keyword_confirm", locale),
                    emoji: e.CheckV,
                    custom_id: customId?.accept || "accept",
                    style: ButtonStyle.Success
                },
                {
                    type: 2,
                    label: t("keyword_cancel", locale),
                    emoji: e.DenyX,
                    custom_id: customId?.cancel || "cancel",
                    style: ButtonStyle.Danger
                }
            ]
        }
    ];
}