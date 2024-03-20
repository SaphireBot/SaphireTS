import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, Colors, codeBlock } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";

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
        name: "history",
        name_localizations: getLocalizations("history.name"),
        description: "[others] Read amazing histories",
        description_localizations: getLocalizations("history.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: "title",
                name_localizations: getLocalizations("history.options.0.name"),
                description: "[others] Choose a title",
                description_localizations: getLocalizations("history.options.0.description"),
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "Sollaris Kingdom - The origin of Saphire Moon",
                        name_localizations: getLocalizations("history.options.0.choices.0"),
                        value: "sollaris"
                    }
                ]
            }
        ]
    },
    additional: {
        category: "others",
        admin: false,
        staff: false,
        api_data: {
            name: "historia",
            description: "Leia histórias incríveis",
            category: "Diversão",
            synonyms: Array.from(
                new Set(
                    Object.values(
                        getLocalizations("history.name") || {}
                    )
                )
            ),
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction) {

            const { options, userLocale: locale, user } = interaction;
            const title = options.getString("title");

            return await interaction.reply({
                embeds: [
                    {
                        color: Colors.Blue,
                        title: `${e.Animated.SaphireReading} ${t(`${title}.title`, locale)}`,
                        description: codeBlock("TXT", `${t(`${title}.1`, locale)}`.split("|").join("\n   ").replace(/\s+-/g, "\n-"))
                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                emoji: "⏮️",
                                custom_id: "0",
                                style: ButtonStyle.Primary,
                                disabled: true
                            },
                            {
                                type: 2,
                                emoji: "◀️",
                                custom_id: "1",
                                style: ButtonStyle.Primary,
                                disabled: true
                            },
                            {
                                type: 2,
                                label: `1/${Object.keys(t(`${title}`, locale)).length - 1}`,
                                custom_id: "page",
                                style: ButtonStyle.Secondary,
                                disabled: true
                            },
                            {
                                type: 2,
                                emoji: "▶️",
                                custom_id: JSON.stringify({ c: "history", pg: "2", k: title, uid: user.id }),
                                style: ButtonStyle.Primary,
                                disabled: `${t(`${title}.2`, locale)}`.length <= 2
                            },
                            {
                                type: 2,
                                emoji: "⏭️",
                                custom_id: JSON.stringify({ c: "history", pg: "last", k: title, uid: user.id }),
                                style: ButtonStyle.Primary,
                                disabled: `${t(`${title}.${(Object.keys(t(`${title}`, locale)).length - 1)}`, locale) }`.length <= 4
                            }
                        ]
                    }
                ].asMessageComponents()
            });
        }
    }
};