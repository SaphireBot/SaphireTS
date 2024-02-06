import { t } from "../../translator";
import { ModalMessageOptionsComponent, RoleGiveaway } from "../../@types/commands";
import { APIActionRowComponent, APIModalActionRowComponent, LocaleString } from "discord.js";
import { ReminderSchemaType } from "../../database/schemas/reminder";

export default new class Modals {
    constructor() { }

    setPrefix(prefixes: string[], locale: LocaleString): ModalMessageOptionsComponent {

        const keywordPrefix = t("keyword_prefix", locale);
        const placeholder = t("setprefix.model.placeholder", locale);

        const components: APIActionRowComponent<APIModalActionRowComponent>[] = [];

        for (let i = 0; i < 5; i++)
            components.push({
                type: 1,
                components: [
                    {
                        type: 4,
                        custom_id: `prefix${i + 1}`,
                        label: `${keywordPrefix} ${i + 1}`,
                        style: 1,
                        placeholder,
                        required: i === 0,
                        value: prefixes[i]?.slice(0, 3),
                        min_length: i === 0 ? 1 : 0,
                        max_length: 3
                    }
                ]
            });

        return {
            title: t("setprefix.model.title", locale),
            custom_id: JSON.stringify({ c: "prefix" }),
            components
        };
    }

    giveawayDefineMultJoins(roles: RoleGiveaway[]): ModalMessageOptionsComponent {

        const components: APIActionRowComponent<APIModalActionRowComponent>[] = [];

        for (const r of roles.slice(0, 5))
            components.push({
                type: 1,
                components: [
                    {
                        type: 4,
                        custom_id: r.role?.id,
                        label: r.role.name,
                        style: 1,
                        placeholder: "1, 2, 3, 4, 5... Max: 100",
                        required: true,
                        min_length: 1,
                        max_length: 3,
                        value: `${r.joins || 1}`
                    }
                ]
            });

        return {
            title: "GIVEAWAY | Multiplas Entradas",
            custom_id: "ModalMultipleJoins",
            components
        };
    }

    reminderRevalidate(data: ReminderSchemaType, locale: LocaleString): ModalMessageOptionsComponent {

        return {
            title: t("reminder.modal.title", locale),
            custom_id: JSON.stringify({ messageId: data.messageId, c: "reminder" }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "text",
                            label: t("reminder.modal.text.label", locale),
                            style: 2,
                            min_length: 1,
                            max_length: 700,
                            placeholder: t("reminder.modal.text.placeholder", locale),
                            value: data.message!,
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "time",
                            label: t("reminder.modal.time.label", locale),
                            style: 1,
                            placeholder: t("reminder.modal.time.placeholder", locale),
                            value: Date.stringDate(data.lauchAt!.valueOf() - Date.now(), false, locale),
                            required: true
                        }
                    ]
                }, // MAX: 5 Fields
            ]
        };

    }

    searchAnime(locale: LocaleString): ModalMessageOptionsComponent {

        return {
            title: t("anime.search_anime", locale),
            custom_id: JSON.stringify({ c: "anime_search" }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "anime_or_manga",
                            label: "Anime? Manga?",
                            style: 1,
                            min_length: 5,
                            max_length: 5,
                            placeholder: "anime | manga",
                            // value: data.message!,
                            required: false
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "input",
                            label: t("anime.work_title", locale),
                            style: 1,
                            min_length: 3,
                            max_length: 20,
                            placeholder: t("anime.type_your_search", locale),
                            // value: "",
                            required: true
                        }
                    ]
                }, // MAX: 5 Fields
            ]
        };

    }
};