import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, Colors, Routes, parseEmoji, time } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import { Config } from "../../../util/constants";
import { TopGGManager } from "../../../managers";
import { Vote } from "../../../@types/database";

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
        name: "vote",
        name_localizations: getLocalizations("vote.name"),
        description: "[bot] Get some rewards voting in me at Top.GG",
        description_localizations: getLocalizations("vote.description"),
        default_member_permissions: undefined,
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "options",
                name_localizations: getLocalizations("vote.options.0.name"),
                description: "Some options to vote command",
                description_localizations: getLocalizations("vote.options.0.description"),
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "cancel",
                        name_localizations: getLocalizations("vote.options.0.choices.0"),
                        value: "cancel"
                    },
                    {
                        name: "enable reminder",
                        name_localizations: getLocalizations("vote.options.0.choices.1"),
                        value: "reminder"
                    }
                ]
            }
        ]
    },
    additional: {
        category: "bot",
        admin: false,
        staff: false,
        api_data: {
            name: "vote",
            description: "Vote no Top.GG e ganhe recompensas",
            category: "Saphire",
            synonyms: [],
            tags: [],
            perms: {
                user: [],
                bot: []
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale, user, channelId, guildId, options } = interaction;
            const msg = await interaction.reply({ content: t("vote.loading", { e, locale }), fetchReply: true });
            const vote = await TopGGManager.fetch(user.id);

            if (options.getString("options") === "cancel") return await cancel(vote);

            const data = await Database.getUser(user.id) || {} as any;

            const timeDifferent = (data.Timeouts?.TopGGVote || 0) > Date.now();
            if (timeDifferent)
                return await msg.edit({
                    content: t("vote.timeout", {
                        e,
                        locale,
                        time: time(new Date(data.Timeouts!.TopGGVote), "R")
                    })
                }).catch(() => { });

            if (vote)
                if (!vote.messageUrl)
                    await TopGGManager.delete(vote);
                else
                    return await interaction.editReply({
                        content: t("vote.your_message_vote", {
                            e,
                            locale,
                            link: vote.messageUrl
                        }),
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        emoji: parseEmoji("📨")!,
                                        url: vote.messageUrl,
                                        style: ButtonStyle.Link
                                    },
                                    {
                                        type: 2,
                                        label: t("vote.vote", locale),
                                        emoji: parseEmoji(e.topgg)!,
                                        url: Config.TopGGLink,
                                        style: ButtonStyle.Link
                                    },
                                    {
                                        type: 2,
                                        label: t("keyword_reset", locale),
                                        emoji: parseEmoji(e.Trash)!,
                                        custom_id: JSON.stringify({ c: "vote", src: "reset", uid: user.id }),
                                        style: ButtonStyle.Primary
                                    }
                                ]
                            }
                        ]
                    }).catch(() => { });

            const document = await TopGGManager.createOrUpdate({
                userId: user.id,
                data: {
                    $set: {
                        channelId,
                        guildId,
                        messageId: msg.id,
                        messageUrl: msg.url,
                        userId: user.id,
                        deleteAt: Date.now() + (1000 * 60 * 60),
                        enableReminder: options.getString("options") === "reminder"
                    }
                }
            });

            return await msg.edit({
                content: document ? null : t("vote.error_to_create", { e, locale }),
                embeds: document
                    ? [{
                        color: Colors.Blue,
                        title: `${e.topgg} Top.GG Bot List`,
                        description: t("vote.waiting_vote", { e, locale })
                    }]
                    : [],
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("vote.vote", locale),
                            emoji: parseEmoji(e.Upvote),
                            url: Config.TopGGLink,
                            style: ButtonStyle.Link
                        },
                        {
                            type: 2,
                            label: t("vote.cancel", locale),
                            custom_id: JSON.stringify({ c: "vote", uid: user.id }),
                            emoji: parseEmoji(e.Trash),
                            style: ButtonStyle.Danger
                        }
                    ]
                }].asMessageComponents()
            });

            async function cancel(vote: Vote | undefined | null) {
                if (!vote) return await msg.edit({ content: t("vote.no_exists", { e, locale }) });
                await client.rest.delete(Routes.channelMessage(`${vote.channelId}`, `${vote.messageId}`)).catch(() => null);
                await msg.edit({ content: t("vote.cancelling", { e, locale }) });
                await TopGGManager.deleteByUserId(user.id);
                return await msg.edit({ content: t("vote.canceled", { e, locale }) });
            }
        }
    }
};