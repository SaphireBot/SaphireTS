import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, MessageFlags, Routes, TextDisplayBuilder, time } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import { TopGGManager } from "../../../managers";
import { Vote } from "../../../@types/database";
import voteEnable from "../../functions/vote/vote.enable";
import voteAwaiting from "../../functions/vote/vote.awaiting";

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
                        value: "cancel",
                    },
                    {
                        name: "enable reminder",
                        name_localizations: getLocalizations("vote.options.0.choices.1"),
                        value: "reminder",
                    },
                ],
            },
        ],
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
                bot: [],
            },
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale, user, options } = interaction;
            const msg = await interaction
                .reply({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [
                        new TextDisplayBuilder({
                            content: t("vote.loading", { e, locale }),
                        }),
                    ],
                    withResponse: true,
                })
                .then(res => res.resource?.message);

            if (!msg) return;

            const vote = await TopGGManager.fetcher(user.id);

            if (options.getString("options") === "cancel") return await cancel(vote);

            const data = await Database.getUser(user.id) || {} as any;

            const timeDifferent = (data.Timeouts?.TopGGVote || 0) > Date.now();
            if (timeDifferent)
                return await msg?.edit({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [
                        new TextDisplayBuilder({
                            content: t("vote.timeout", {
                                e,
                                locale,
                                time: time(new Date(data.Timeouts!.TopGGVote), "R"),
                                votes: data?.TopGGVotes || 0,
                            }),
                        }),
                    ],
                }).catch(() => { });

            if (vote)
                if (!vote.messageUrl)
                    await TopGGManager.delete(vote);
                else return voteEnable(interaction, vote);

            return voteAwaiting(interaction, msg, null, options.getString("options") === "reminder");

            async function cancel(vote: Vote | undefined | null) {
                if (!vote) return await interaction.editReply({ content: t("vote.no_exists", { e, locale }) });
                await client.rest.delete(Routes.channelMessage(`${vote.channelId}`, `${vote.messageId}`)).catch(() => null);
                await msg?.edit({ content: t("vote.cancelling", { e, locale }) }).catch(() => { });
                return await TopGGManager.deleteByUserId(user.id);
            }
        },
    },
};