import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import Database from "../../../database";
import { tempcallOptions } from "../../components/buttons/buttons.get";
import tempcallRanking from "../../functions/ranking/tempcall";
import { DiscordPermissons } from "../../../util/constants";

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
        name: "tempcall",
        name_localizations: getLocalizations("tempcall.name"),
        description: "A giant system with count the tempcall of all members",
        description_localizations: getLocalizations("tempcall.description"),
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "config",
                name_localizations: getLocalizations("tempcall.options.0.name"),
                description: "System's configuration",
                description_localizations: getLocalizations("tempcall.options.0.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "method",
                        name_localizations: getLocalizations("tempcall.options.0.options.0.name"),
                        description: "Choose a method",
                        description_localizations: getLocalizations("tempcall.options.0.options.0.description"),
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            {
                                name: "Enable/disable the tempcall counter",
                                name_localizations: getLocalizations("tempcall.options.0.options.0.choices.0"),
                                value: "layout"
                            },
                            {
                                name: "Reset Ranking",
                                name_localizations: getLocalizations("tempcall.options.0.options.0.choices.1"),
                                value: "reset"
                            }
                        ]
                    }
                ]
            },
            {
                name: "ranking",
                name_localizations: getLocalizations("tempcall.options.1.name"),
                description: "The tempcall ranking",
                description_localizations: getLocalizations("tempcall.options.1.description"),
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "member",
                        name_localizations: getLocalizations("tempcall.options.1.options.0.name"),
                        description: "Choose a member to see their ranking",
                        description_localizations: getLocalizations("tempcall.options.1.options.0.description"),
                        type: ApplicationCommandOptionType.User
                    }
                ]
            }
        ]
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            name: "tempcall",
            description: "Um grande sistem de tempo em call",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.Administrator],
                bot: [DiscordPermissons.Administrator]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { options, member, userLocale: locale, guildId } = interaction;
            const subCommand = options.getSubcommand();

            const execute = { config }[subCommand];

            if (subCommand === "ranking")
                return await tempcallRanking(interaction);

            if (!execute)
                return interaction.reply({
                    content: `${e.DenyX} | Sub-command not found. #9989898565`
                });

            return execute();

            async function config() {

                if (!member.permissions.has(PermissionFlagsBits.Administrator))
                    return await interaction.reply({
                        content: t("tempcall.you_do_not_have_permissions", { e, locale }),
                        ephemeral: true
                    });

                const method = options.getString("method");

                return { reset, layout }[method as "reset" | "layout"]();

                async function reset() {

                    await interaction.reply({ content: t("tempcall.loading", { e, locale }) });
                    const data = (await Database.getGuild(guildId))?.TempCall;

                    if (
                        !data
                        || (!data?.members && !data?.membersMuted)
                        || (
                            !Object.values(data?.members || {})?.length
                            && !Object.values(data?.membersMuted || {})?.length
                        )
                    )
                        return await interaction.editReply({ content: t("tempcall.empty_ranking", { e, locale }) });

                    return await interaction.editReply({
                        content: t("tempcall.do_you_really_want_reset_it", { e, locale }),
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        label: t("keyword_confirm", locale),
                                        custom_id: JSON.stringify({ c: "tempcall", src: "reset" }),
                                        style: ButtonStyle.Danger
                                    },
                                    {
                                        type: 2,
                                        label: t("keyword_cancel", locale),
                                        custom_id: JSON.stringify({ c: "tempcall", src: "cancel" }),
                                        style: ButtonStyle.Success
                                    }
                                ]
                            }
                        ]
                    });
                }

                async function layout() {

                    await interaction.reply({ content: t("tempcall.loading", { e, locale }) });

                    const guildData = await Database.getGuild(guildId);

                    const data = {
                        enable: guildData?.TempCall?.enable || false,
                        muteTime: guildData?.TempCall?.muteTime || false
                    };

                    return await interaction.editReply({
                        content: t("tempcall.content_status", { e, locale, client, status: data.enable ? t("keyword_enable", locale) : t("keyword_disable", locale) }),
                        components: tempcallOptions(data, locale)
                    });

                }
            }
        }
    }
};