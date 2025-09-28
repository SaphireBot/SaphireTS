import { t } from "../../translator";
import { ModalMessageOptionsComponent, ReminderType, RoleGiveaway } from "../../@types/commands";
import { APIActionRowComponent } from "discord.js";
import { Config, LocaleString } from "../../util/constants";
import { LocalizationsKeys } from "../../@types/quiz";
import Stop from "../stop/stop";
import Reminder from "../reminder/reminder";
import { Types } from "mongoose";

export default new class AllModals {
    constructor() { }

    setPrefix(prefixes: string[], locale: LocaleString, byControlCenter?: boolean): ModalMessageOptionsComponent {

        const keywordPrefix = t("keyword_prefix", locale);
        const placeholder = t("setprefix.model.placeholder", locale);

        const components: APIActionRowComponent<any>[] = [];

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
                        required: false,
                        value: prefixes[i]?.slice(0, 3),
                        max_length: 3,
                    },
                ],
            });

        return {
            title: t("setprefix.model.title", locale),
            custom_id: JSON.stringify({ c: "prefix", byControlCenter }),
            components,
        };
    }

    setMyPrefix(prefixes: string[], locale: LocaleString): ModalMessageOptionsComponent {

        const keywordPrefix = t("keyword_prefix", locale);
        const placeholder = t("setprefix.model.placeholder", locale);

        const components: APIActionRowComponent<any>[] = [];

        for (let i = 0; i < 2; i++)
            components.push({
                type: 1,
                components: [
                    {
                        type: 4,
                        custom_id: `prefix${i + 1}`,
                        label: `${keywordPrefix} ${i + 1}`,
                        style: 1,
                        placeholder,
                        required: false,
                        value: prefixes[i]?.slice(0, 3),
                        max_length: 3,
                    },
                ],
            });

        return {
            title: t("prefix.model.title", locale),
            custom_id: JSON.stringify({ c: "prefix", src: "user" }),
            components,
        };
    }

    giveawayDefineMultJoins(roles: RoleGiveaway[]): ModalMessageOptionsComponent {

        const components: APIActionRowComponent<any>[] = [];

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
                        value: `${r.joins || 1}`,
                    },
                ],
            });

        return {
            title: "GIVEAWAY | Multiplas Entradas",
            custom_id: "ModalMultipleJoins",
            components,
        };
    }

    reminderRevalidate(data: Reminder | ReminderType, locale: LocaleString): ModalMessageOptionsComponent {

        return {
            title: t("reminder.modal.title", locale),
            custom_id: JSON.stringify({ id: data.id, c: "reminder" }),
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
                            required: true,
                        },
                    ],
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
                            required: true,
                        },
                    ],
                }, // MAX: 5 Fields
            ],
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
                            required: false,
                        },
                    ],
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
                            required: true,
                        },
                    ],
                }, // MAX: 5 Fields
            ],
        };

    }

    defineTeamsParticipants(locale: LocaleString): ModalMessageOptionsComponent {

        return {
            title: t("teams.components.modal.title", locale),
            custom_id: JSON.stringify({ c: "teams" }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "max_participants",
                            label: t("teams.components.modal.label", locale).limit("TextInputLabel"),
                            style: 1,
                            min_length: 1,
                            max_length: 3,
                            placeholder: t("teams.components.modal.placeholder", locale),
                            required: true,
                        },
                    ],
                },
            ],
        };

    }

    get embedGenerator() {
        return {
            title: (
                {
                    locale,
                    title,
                    description,
                    author,
                    color,
                }: {
                    locale: LocaleString,
                    title?: string,
                    description?: string,
                    author?: string,
                    color?: number
                },
            ): ModalMessageOptionsComponent => {

                return {
                    title: t("embed.components.modals.body.title_modal", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "body" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "title",
                                    label: t("embed.components.modals.body.title.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 256,
                                    placeholder: title ? undefined : t("embed.components.modals.body.title.placeholder", locale),
                                    value: title ? title : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "description",
                                    label: t("embed.components.modals.body.description.label", locale),
                                    style: 2,
                                    min_length: 0,
                                    max_length: 4000,
                                    placeholder: description ? undefined : t("embed.components.modals.body.description.placeholder", locale),
                                    value: description ? description : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "author",
                                    label: t("embed.components.modals.body.author.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 256,
                                    placeholder: author ? undefined : t("embed.components.modals.body.author.placeholder", locale),
                                    value: author ? author : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "color",
                                    label: t("embed.components.modals.body.color.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 10,
                                    placeholder: color ? undefined : t("embed.components.modals.body.color.placeholder", locale),
                                    value: color ? `${color}` : undefined,
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };

            },
            links: (
                {
                    locale,
                    url,
                    image,
                    thumbnail,
                    author,
                }: {
                    locale: LocaleString,
                    url?: string,
                    image?: string,
                    thumbnail?: string,
                    author?: string
                },
            ): ModalMessageOptionsComponent => {

                return {
                    title: t("embed.components.modals.links.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "links" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "url",
                                    label: t("embed.components.modals.links.url.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 4000,
                                    placeholder: url ? undefined : t("embed.components.modals.links.url.placeholder", locale),
                                    value: url ? url : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "image",
                                    label: t("embed.components.modals.links.image.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 4000,
                                    placeholder: image ? undefined : t("embed.components.modals.links.image.placeholder", locale),
                                    value: image ? image : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "thumbnail",
                                    label: "Thumbnail",
                                    style: 1,
                                    min_length: 0,
                                    max_length: 4000,
                                    placeholder: thumbnail ? undefined : t("embed.components.modals.links.thumbnail.placeholder", locale),
                                    value: thumbnail ? thumbnail : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "author",
                                    label: t("embed.components.modals.links.author.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 4000,
                                    placeholder: author ? undefined : t("embed.components.modals.links.author.placeholder", locale),
                                    value: author ? author : undefined,
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };

            },
            footer: (
                {
                    locale,
                    icon,
                    text,
                }: {
                    locale: LocaleString,
                    icon?: string,
                    text?: string
                },
            ): ModalMessageOptionsComponent => {

                return {
                    title: t("embed.components.modals.footer.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "footer" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "url",
                                    label: t("embed.components.modals.footer.icon.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 4000,
                                    placeholder: icon ? undefined : t("embed.components.modals.footer.icon.placeholder", locale),
                                    value: icon ? icon : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "text",
                                    label: t("embed.components.modals.footer.text.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 2048,
                                    placeholder: text ? undefined : t("embed.components.modals.footer.text.placeholder", locale),
                                    value: text ? text : undefined,
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };

            },
            fields: (locale: LocaleString): ModalMessageOptionsComponent => {
                const yes = t("yes", locale);
                return {
                    title: t("embed.components.modals.fields.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "fields" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "name",
                                    label: t("embed.components.modals.fields.name.label", locale),
                                    style: 1,
                                    min_length: 1,
                                    max_length: 256,
                                    placeholder: t("embed.components.modals.fields.name.placeholder", locale),
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "value",
                                    label: t("embed.components.modals.fields.value.label", locale),
                                    style: 1,
                                    min_length: 2,
                                    max_length: 1024,
                                    placeholder: t("embed.components.modals.fields.value.placeholder", locale),
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "inline",
                                    label: t("embed.components.modals.fields.inline.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: yes.length,
                                    placeholder: t("embed.components.modals.fields.inline.placeholder", { locale, yes }),
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };

            },
            fieldsEdit: (
                locale: LocaleString,
                name: string,
                value: string,
                inline: boolean,
                index: string,
            ): ModalMessageOptionsComponent => {
                const yes = t("yes", locale);
                return {
                    title: t("embed.components.modals.fields.title_edit", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "fields", index }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "name",
                                    label: t("embed.components.modals.fields.name.label", locale),
                                    style: 1,
                                    min_length: 1,
                                    max_length: 256,
                                    placeholder: t("embed.components.modals.fields.name.placeholder", locale),
                                    value: name,
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "value",
                                    label: t("embed.components.modals.fields.value.label", locale),
                                    style: 1,
                                    min_length: 1,
                                    max_length: 1024,
                                    placeholder: t("embed.components.modals.fields.value.placeholder", locale),
                                    value,
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "inline",
                                    label: t("embed.components.modals.fields.inline.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: yes.length,
                                    placeholder: t("embed.components.modals.fields.inline.placeholder", { locale, yes }),
                                    value: inline ? yes : undefined,
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "delete",
                                    label: t("embed.components.modals.fields.delete.label", locale),
                                    style: 1,
                                    min_length: 6,
                                    max_length: 6,
                                    placeholder: t("embed.components.modals.fields.delete.placeholder", locale),
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };

            },
            json: (locale: LocaleString, raw: string) => {
                return {
                    title: t("embed.components.modals.json.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "json" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "json",
                                    label: t("embed.components.modals.json.label", locale),
                                    style: 2,
                                    max_length: 4000,
                                    placeholder: t("embed.components.modals.json.placeholder", locale),
                                    value: raw?.length > 4000 ? undefined : raw,
                                    required: true,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
            messageLink: (locale: LocaleString) => {
                return {
                    title: t("embed.components.modals.messageLink.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "messageLink" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "link",
                                    label: t("embed.components.modals.messageLink.label", locale),
                                    style: 1,
                                    placeholder: t("embed.components.modals.messageLink.placeholder", locale),
                                    required: true,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
            color: (
                {
                    locale,
                    color,
                }: {
                    locale: LocaleString,
                    color: string
                },
            ): ModalMessageOptionsComponent => {

                return {
                    title: t("embed.components.modals.color.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "color" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "color",
                                    label: t("embed.components.modals.color.label", locale),
                                    style: 1,
                                    min_length: 0,
                                    max_length: 10,
                                    placeholder: color.includes("undefined") ? t("embed.components.modals.color.placeholder", locale) : undefined,
                                    value: color.includes("undefined") ? undefined : `${color}`,
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };

            },
            webhook: (locale: LocaleString, channelId: string): ModalMessageOptionsComponent => {

                return {
                    title: t("embed.components.modals.webhook.title", locale),
                    custom_id: JSON.stringify({ c: "embed", src: "webhook", ch: channelId }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "name",
                                    label: t("embed.components.modals.webhook.name.label", locale),
                                    style: 1,
                                    min_length: 1,
                                    max_length: 80,
                                    placeholder: t("embed.components.modals.webhook.name.placeholder", locale),
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "avatar",
                                    label: t("embed.components.modals.webhook.avatar.label", locale),
                                    style: 1,
                                    placeholder: t("embed.components.modals.webhook.avatar.placeholder", locale),
                                    required: false,
                                },
                            ],
                        },// MAX: 5 Fields
                    ],
                };

            },
        };
    }

    characterEditPrincipalData(
        {
            name,
            artwork,
            gender,
            category,
            pathname,
        }: {
            name: string | undefined,
            artwork: string | undefined,
            gender: string | undefined,
            category: string | undefined,
            pathname?: string
        },
    ): ModalMessageOptionsComponent {

        return {
            title: "Edição de campo prioritário",
            custom_id: JSON.stringify({ c: "quiz", src: "edit", id: "priority", pathname }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "name",
                            label: "Nome original do personagem",
                            style: 1,
                            min_length: 1,
                            max_length: 50,
                            placeholder: "Nome original do personagem",
                            value: name,
                            required: true,
                        },
                    ],
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "artwork",
                            label: "Nome original da obra",
                            style: 1,
                            min_length: 1,
                            max_length: 200,
                            placeholder: "Nome original da obra",
                            value: artwork,
                            required: true,
                        },
                    ],
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "gender",
                            label: "Gênero do personagem",
                            style: 1,
                            min_length: 1,
                            max_length: 6,
                            placeholder: "male | female | others",
                            value: gender,
                            required: true,
                        },
                    ],
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "category",
                            label: "Categoria da obra",
                            style: 1,
                            min_length: 1,
                            max_length: 50,
                            placeholder: "anime | movie | game | serie | animation | hq | k-drama",
                            value: category,
                            required: true,
                        },
                    ],
                }, // MAX: 5 Fields
            ],
        };

    }

    characterEditAnotherAnswers(answers: string[], pathname?: string): ModalMessageOptionsComponent {

        return {
            title: "Edição de campo | Outras Respostas",
            custom_id: JSON.stringify({ c: "quiz", src: "edit", id: "answers", pathname }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "another_answers",
                            label: "Outras possíveis respostas",
                            style: 2,
                            min_length: 0,
                            placeholder: "Separe as respostas por vírgula",
                            value: answers?.join(", "),
                            required: false,
                        },
                    ],
                }, // MAX: 5 Fields
            ],
        };

    }

    characterEditLanguage(data: [string, string, string | undefined][], pathname: string): ModalMessageOptionsComponent {

        const components = [];

        for (const [custom_id, lang, value] of data) {

            const locale = custom_id.replace("_artwork", "").replace("_name", "");

            components.push({
                type: 1,
                components: [{
                    type: 4,
                    custom_id: lang,
                    label: `${Config.flagLocales[locale as LocalizationsKeys]} ${custom_id.includes("_artwork") ? "OBRA" : "PERSONAGEM"} - Tradução para ${t(`keyword_language.${locale}`, "pt-BR")}`,
                    style: 1,
                    min_length: 0,
                    placeholder: "Tradução...",
                    value,
                    required: false,
                }],
            } as any);

        }

        return {
            title: "Edição de Traduções",
            custom_id: JSON.stringify({ c: "quiz", src: "edit", id: "langs", pathname }),
            components,
        };

    }

    get charactersRemoveBlockedUser() {
        return {
            title: "Remoção de Bloqueio Temporário",
            custom_id: JSON.stringify({ c: "quiz", src: "unblockUser" }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "userId",
                            label: "ID do usuário bloqueado",
                            style: 1,
                            min_length: 17,
                            max_length: 19,
                            placeholder: "ID do Usuário",
                            required: true,
                        },
                    ],
                }, // MAX: 5 Fields
            ],
        };
    }

    editStopCategories(categories: string[], locale: LocaleString): ModalMessageOptionsComponent {
        return {
            title: t("stop.modals.titles.0", locale),
            custom_id: JSON.stringify({ c: "stop", src: "categories" }),
            components: [{
                type: 1,
                components: [{
                    type: 4,
                    custom_id: "categories",
                    label: t("stop.modals.labels.0", locale),
                    style: 2,
                    min_length: 0,
                    placeholder: t("stop.modals.placeholders.0", locale),
                    value: categories.join(", "),
                    required: true,
                }],
            }],
        };

    }

    editStopPersonalCategories(categories: string[], locale: LocaleString): ModalMessageOptionsComponent {
        return {
            title: t("stop.modals.titles.1", locale),
            custom_id: JSON.stringify({ c: "stop", src: "custom_categories" }),
            components: [{
                type: 1,
                components: [{
                    type: 4,
                    custom_id: "categories",
                    label: t("stop.modals.labels.0", locale),
                    style: 2,
                    min_length: 0,
                    placeholder: t("stop.modals.placeholders.1", locale),
                    value: categories.join(", "),
                    required: true,
                }],
            }],
        };

    }

    replyStopCategories(
        categories: string[],
        locale: LocaleString,
        game: Stop,
        userId: string,
        letter: string,
    ): ModalMessageOptionsComponent {
        const component = {
            title: t("stop.modals.titles.2", locale),
            custom_id: JSON.stringify({ c: "stop", src: "reply" }),
            components: [] as any[],
        };

        for (const cat of categories)
            component.components.push({
                type: 1,
                components: [{
                    type: 4,
                    custom_id: cat,
                    label: cat,
                    style: 1,
                    placeholder: t("stop.modals.placeholders.2", { locale, letter: letter.toUpperCase() }),
                    value: game?.categories?.[cat]?.get(userId) || undefined,
                    required: false,
                }],
            });

        return component;
    }

    get welcome() {
        return {
            embed(locale: LocaleString, raw: string): ModalMessageOptionsComponent {
                return {
                    title: t("welcome.components.modal.title", locale),
                    custom_id: JSON.stringify({ c: "welcome", src: "embed" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "embed",
                                    label: t("embed.components.modals.json.label", locale),
                                    style: 2,
                                    max_length: 4000,
                                    placeholder: t("welcome.components.modal.placeholder", locale),
                                    value: raw.length > 4000 ? undefined : raw,
                                    required: true,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
            content(locale: LocaleString, raw: string): ModalMessageOptionsComponent {
                return {
                    title: t("welcome.components.modal.title", locale),
                    custom_id: JSON.stringify({ c: "welcome", src: "content" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "content",
                                    label: t("welcome.components.modal.write_the_text", locale),
                                    style: 2,
                                    max_length: 2000,
                                    placeholder: t("welcome.components.modal.placeholder", locale),
                                    value: raw.length > 2000 ? undefined : raw,
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
            messageLink: (locale: LocaleString) => {
                return {
                    title: t("welcome.components.modal.title", locale),
                    custom_id: JSON.stringify({ c: "welcome", src: "embedLink" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "url",
                                    label: t("embed.components.modals.messageLink.label", locale),
                                    style: 1,
                                    placeholder: t("embed.components.modals.messageLink.placeholder", locale),
                                    required: true,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
        };
    }

    get leave() {
        return {
            embed(locale: LocaleString, raw: string): ModalMessageOptionsComponent {
                return {
                    title: t("leave.components.modal.title", locale),
                    custom_id: JSON.stringify({ c: "leave", src: "embed" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "embed",
                                    label: t("embed.components.modals.json.label", locale),
                                    style: 2,
                                    max_length: 4000,
                                    placeholder: t("leave.components.modal.placeholder", locale),
                                    value: raw.length > 4000 ? undefined : raw,
                                    required: true,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
            content(locale: LocaleString, raw: string): ModalMessageOptionsComponent {
                return {
                    title: t("leave.components.modal.title", locale),
                    custom_id: JSON.stringify({ c: "leave", src: "content" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "content",
                                    label: t("leave.components.modal.write_the_text", locale),
                                    style: 2,
                                    max_length: 2000,
                                    placeholder: t("leave.components.modal.placeholder", locale),
                                    value: raw.length > 2000 ? undefined : raw,
                                    required: false,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
            messageLink: (locale: LocaleString) => {
                return {
                    title: t("leave.components.modal.title", locale),
                    custom_id: JSON.stringify({ c: "leave", src: "embedLink" }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "url",
                                    label: t("embed.components.modals.messageLink.label", locale),
                                    style: 1,
                                    placeholder: t("embed.components.modals.messageLink.placeholder", locale),
                                    required: true,
                                },
                            ],
                        }, // MAX: 5 Fields
                    ],
                };
            },
        };
    }

    createQrCode(locale: LocaleString, uid: string): ModalMessageOptionsComponent {

        return {
            title: t("qrcode.modal.title", locale),
            custom_id: JSON.stringify({ c: "qr", uid }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "name",
                            label: t("qrcode.modal.name", locale).limit("TextInputLabel"),
                            style: 1,
                            min_length: 1,
                            max_length: 30,
                            placeholder: t("qrcode.modal.name_placeholder", locale).limit("TextInputLabel"),
                            required: true,
                        },
                    ],
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "content",
                            label: t("qrcode.modal.label", locale).limit("TextInputLabel"),
                            style: 1,
                            min_length: 1,
                            max_length: 1000,
                            placeholder: t("qrcode.modal.placeholder", locale).limit("TextInputLabel"),
                            required: true,
                        },
                    ],
                },
            ],
        };

    }

    chooseLottoNumber(locale: LocaleString, uid: string): ModalMessageOptionsComponent {

        return {
            title: t("lotto.modal.title", locale),
            custom_id: JSON.stringify({ c: "lotto", uid }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: "number",
                            label: t("lotto.modal.label", locale).limit("TextInputLabel"),
                            style: 1,
                            min_length: 1,
                            max_length: 3,
                            placeholder: t("lotto.modal.placeholder", locale).limit("TextInputLabel"),
                            required: true,
                        },
                    ],
                },
            ],
        };

    }

    rebootModalReason(locale: LocaleString, uid: string) {

        return {
            title: t("staff.modal.reboot.title", locale),
            custom_id: JSON.stringify({ c: "staff", src: "reboot", uid }),
            components: [
                {
                    type: 1,
                    description: t("staff.embed.fields.reboot.value", locale),
                    components: [
                        {
                            type: 4,
                            custom_id: "reason",
                            label: t("staff.modal.reboot.label", locale).limit("TextInputLabel"),
                            style: 2,
                            min_length: 1,
                            max_length: 800,
                            value: t("staff.modal.reboot.value", locale).limit("TextInputValue"),
                            required: true,
                        },
                    ],
                },
            ],
        };

    }

    sendPhraseToBattlaroyale(locale: LocaleString) {

        return {
            title: t("battleroyale.components.modal_title", locale),
            custom_id: JSON.stringify({ c: "battleroyale", src: "phrase" }),
            components: [
                {
                    type: 1,
                    description: t("battleroyale.components.modal_description", locale),
                    components: [
                        {
                            type: 4,
                            custom_id: "phrase",
                            label: t("battleroyale.components.phrase", locale).limit("TextInputLabel"),
                            style: 2,
                            min_length: 1,
                            max_length: 60,
                            placeholder: t("battleroyale.components.placeholder", locale).limit("TextInputPlaceholder"),
                            required: true,
                        },
                    ],
                },
            ],
        };

    }

    reviewPhraseToBattlaroyale(locale: LocaleString, _id: Types.ObjectId, value: string) {

        return {
            title: `${t("battleroyale.components.modal_title", locale)} REVIEW`,
            custom_id: JSON.stringify({ c: "battleroyale", src: "review" }),
            components: [
                {
                    type: 1,
                    description: t("battleroyale.components.modal_description", locale),
                    components: [
                        {
                            type: 4,
                            custom_id: "phrase",
                            label: _id.toString(),
                            style: 2,
                            min_length: 1,
                            max_length: 60,
                            placeholder: t("battleroyale.components.placeholder", locale).limit("TextInputPlaceholder"),
                            required: true,
                            value: value.limit(60),
                        },
                    ],
                },
            ],
        };

    }

    // API Builder
    get ModalWithSelectMenu() {
        return {
            title: "Título do Modal",
            custom_id: JSON.stringify({ c: "___a", uid: "0" }),
            "components": [
                {
                    "type": 18,
                    "label": "What's your favorite bug?",
                    "component": {
                        "type": 3,
                        "custom_id": "bug_string_select",
                        "placeholder": "Choose...",
                        "options": [
                            {
                                "label": "Ant",
                                "value": "ant",
                                "description": "(best option)",
                                "emoji": {
                                    "name": "🐜",
                                },
                            },
                            {
                                "label": "Butterfly",
                                "value": "butterfly",
                                "emoji": {
                                    "name": "🦋",
                                },
                            },
                            {
                                "label": "Caterpillar",
                                "value": "caterpillar",
                                "emoji": {
                                    "name": "🐛",
                                },
                            },
                        ],
                    },
                },
                {
                    "type": 18,
                    "label": "Why is it your favorite?",
                    "description": "Please provide as much detail as possible!",
                    "component": {
                        "type": 4,
                        "custom_id": "bug_explanation",
                        "style": 2,
                        "min_length": 1000,
                        "max_length": 4000,
                        "placeholder": "Write your explanation here...",
                        "required": true,
                    },
                },
            ],
        };
    }
};