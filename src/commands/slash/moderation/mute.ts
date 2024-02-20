import { time, ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import permissionsMissing from "../../functions/permissionsMissing";
import { setTimeout as sleep } from "node:timers/promises";

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
        name: "mute",
        name_localizations: getLocalizations("mute.name"),
        description: "[moderation] Just a simples command to mute someone",
        description_localizations: getLocalizations("mute.description"),
        default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "members",
                name_localizations: getLocalizations("mute.options.0.name"),
                description: "A mute to be muted. Or, some members",
                description_localizations: getLocalizations("mute.options.0.description"),
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "time",
                name_localizations: getLocalizations("mute.options.1.name"),
                description: "How long time this member keep be muted",
                description_localizations: getLocalizations("mute.options.1.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true
            },
            {
                name: "reason",
                name_localizations: getLocalizations("mute.options.2.name"),
                description: "The mute's reason",
                description_localizations: getLocalizations("mute.options.2.description"),
                type: ApplicationCommandOptionType.String,
                max_length: 512,
                min_length: 0
            }
        ]
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            name: "mute",
            description: "Um simples comando para mutar",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.ModerateMembers],
                bot: [DiscordPermissons.ModerateMembers]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale, guild, options, user } = interaction;

            if (!interaction.member?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.ModerateMembers], "Discord_you_need_some_permissions");

            if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.ModerateMembers], "Discord_client_need_some_permissions");

            await interaction.reply({ content: t("mute.search_members", { e, locale }) });
            await guild.members.fetch();

            const queries = (options.getString("members") || "").split(/ /g);
            const members = guild.members.searchBy(queries);

            if (!members?.size)
                return await interaction.editReply({ content: t("mute.no_members_found", { e, locale }) });

            const timeMs = options.getString("time")?.toDateMS();

            if (!timeMs || timeMs <= 0)
                return await interaction.editReply({
                    content: t("mute.date_not_valid", { e, locale })
                });

            if (members.size === 1 && (Array.from(members.values())[0]?.id === user.id))
                return await interaction.editReply({
                    content: t("ban.you_cannot_mute_you", { e, locale })
                });

            const msg = await interaction.editReply({
                content: t("mute.ask_for_the_mute", {
                    e,
                    locale,
                    size: members.size,
                    members: Array.from(members.values()).map(m => `\`${m?.displayName}\``).format(locale),
                    time: t("mute.muted_until", { locale, time: `\`${Date.stringDate(timeMs, false, locale)}\`` }),
                    end: t("mute.until_end", { locale, time: time(new Date(Date.now() + 15000), "R") })
                }),
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("keyword_confirm", locale),
                                custom_id: "accept",
                                style: ButtonStyle.Danger
                            },
                            {
                                type: 2,
                                label: t("keyword_refuse", locale),
                                custom_id: "refuse",
                                style: ButtonStyle.Success
                            }
                        ]
                    }
                ]
            });

            const muteds = new Set<string>();
            const unmuteds = new Set<string>();
            const reason = options.getString("reason") || t("mute.no_reason", { locale: guild.preferredLocale, user });
            let counter = 0;
            let cancelled = false;

            const collector = msg.createMessageComponentCollector({
                filter: int => int.user.id === user.id,
                time: 15000
            })
                .on("collect", async (int): Promise<any> => {
                    const customId = int.customId;

                    if (["refuse", "cancel"].includes(customId)) {
                        cancelled = true;
                        return collector.stop();
                    }

                    collector.stop("muted");
                    await int.update({
                        content: t("mute.muting", { e, locale, members, counter }),
                        components: members.size > 1
                            ? [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            type: 2,
                                            label: t("keyword_confirm", locale),
                                            custom_id: "accept",
                                            style: ButtonStyle.Danger,
                                            disabled: true
                                        },
                                        {
                                            type: 2,
                                            label: t("keyword_refuse", locale),
                                            custom_id: "cancel",
                                            style: ButtonStyle.Success
                                        }
                                    ]
                                }
                            ]
                            : []
                    });

                    if (members.size === 1) {
                        const member = Array.from(members.values())?.[0];

                        member.disableCommunicationUntil(Date.now() + timeMs, reason)
                            .then(async () => await int.editReply({
                                content: t("mute.member_muted", {
                                    e,
                                    locale,
                                    member,
                                    time: t("mute.muted_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }),
                                    reason
                                })
                            }))
                            .catch(async err => await int.editReply({
                                content: t("mute.fail", {
                                    e,
                                    locale,
                                    member,
                                    err: t(`Discord.Errors.${err.code}`, locale)
                                })
                            }));
                    }

                    collector.resetTimer({ time: 1000 * 60 * 50 });
                    for await (const member of members.values()) {
                        if (cancelled) return;

                        if (member.id === user.id) {
                            unmuteds.add(member.id);
                            continue;
                        }

                        if (
                            cancelled
                            || !guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true)
                        )
                            break;

                        counter++;
                        await member.disableCommunicationUntil(Date.now() + timeMs, reason)
                            .then(() => muteds.add(member.id))
                            .catch(() => unmuteds.add(member.id));

                        await int.editReply({ content: t("mute.muting", { e, locale, members, counter }) });
                        await sleep(1500);
                    }

                    return await interaction.editReply({
                        content: t("mute.success", { e, locale, members, muteds, unmuteds, reason, time: t("mute.muted_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }) }),
                        components: []
                    });
                })
                .on("end", async (_, reason): Promise<any> => {
                    if (["cancel", "muted"].includes(reason)) return;
                    return await interaction.editReply({ content: t("mute.cancelled", { e, locale }), components: [] }).catch(() => { });
                });

            return;
        }
    }
};