import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, Colors, Routes, parseEmoji } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import { Config } from "../../../util/constants";
import { VoteSchema } from "../../../database/models/vote";

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
            const vote = await Database.Vote.findOne({ userId: user.id });

            if (options.getString("options") === "cancel") return await cancel(vote);

            if (vote)
                return await interaction.editReply({
                    content: t("vote.your_message_vote", {
                        e,
                        locale,
                        link: vote.messageUrl
                    })
                });

            const document = await new Database.Vote({
                channelId,
                guildId,
                messageId: msg.id,
                messageUrl: msg.url,
                userId: user.id,
                deleteAt: Date.now() + (1000 * 60 * 60),
                enableReminder: options.getString("options") === "reminder",
                voted: false
            }).save().catch(() => null);

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

            async function cancel(vote: VoteSchema | undefined | null) {
                if (!vote)
                    return await msg.edit({ content: t("vote.no_exists", { e, locale }) });

                await client.rest.delete(Routes.channelMessage(`${vote.channelId}`, `${vote.messageId}`)).catch(() => null);
                await msg.edit({ content: t("vote.cancelling", { e, locale }) });
                await Database.Vote.deleteMany({ userId: user.id });
                return await msg.edit({ content: t("vote.canceled", { e, locale }) });
            }
        }
    }
};