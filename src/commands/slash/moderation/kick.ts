import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
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
        name: "kick",
        name_localizations: getLocalizations("kick.name"),
        description: "[moderation] Just a simples command to kick a member",
        description_localizations: getLocalizations("kick.description"),
        default_member_permissions: PermissionFlagsBits.KickMembers.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "members",
                name_localizations: getLocalizations("kick.options.0.name"),
                description: "A member to kick. Or, some members",
                description_localizations: getLocalizations("kick.options.0.description"),
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "reason",
                name_localizations: getLocalizations("kick.options.1.name"),
                description: "The kick's reason",
                description_localizations: getLocalizations("kick.options.1.description"),
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
            name: "kick",
            description: "Um simples comando para expulsar alguém do servidor",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.KickMembers],
                bot: [DiscordPermissons.KickMembers]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale, guild, options, user } = interaction;

            if (!interaction.member?.permissions.has(PermissionFlagsBits.KickMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.KickMembers], "Discord_you_need_some_permissions");

            if (!guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.KickMembers], "Discord_client_need_some_permissions");

            await interaction.reply({ content: t("kick.search_members", { e, locale }) });
            await guild.members.smartFetch();

            const queries = (options.getString("members") || "").split(/ /g);
            const members = guild.members.searchBy(queries);

            if (!members?.size)
                return await interaction.editReply({ content: t("kick.no_members_found", { e, locale }) });

            let content = "";

            if (members.delete(client.user!.id))
                content += `${t("kick.saphire_kick", { e, locale })}\n`;

            if (members.delete(user.id))
                content += `${t("kick.you_cannot_kick_you", { e, locale })}\n`;

            const noPermissionsToKick = new Map<string, GuildMember>();

            if (guild.ownerId !== user.id)
                for (const member of members.values())
                    if (
                        interaction.member.roles.highest.comparePositionTo(member.roles.highest) >= 1
                        || member.permissions.has(PermissionFlagsBits.KickMembers, true)
                    ) {
                        noPermissionsToKick.set(member.id, member);
                        members.delete(member.id);
                    }

            if (noPermissionsToKick.size)
                content += `${t("kick.noPermissionsToKickMembers", { e, locale, members: noPermissionsToKick.size })}\n`;

            if (!members.size && content.length)
                return await interaction.editReply({ content });

            const msg = await interaction.editReply({
                content: content += t("kick.ask_for_the_kick", {
                    e,
                    locale,
                    size: members.size,
                    members: Array.from(members.values()).map(m => `\`${m?.displayName}\``).format(locale),
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

            const kickeds = new Set<string>();
            const unkickeds = new Set<string>();
            const reason = options.getString("reason") || t("kick.no_reason", { locale: guild.preferredLocale, user });
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

                    collector.stop("kicked");
                    await int.update({
                        content: t("kick.kicking", { e, locale, members, counter }),
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
                        return await guild.members.kick(member.id, reason)
                            .then(async () => await int.editReply({
                                content: t("kick.member_kicked", {
                                    e,
                                    locale,
                                    member,
                                    reason
                                })
                            }))
                            .catch(async err => await int.editReply({
                                content: t("kick.fail", {
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

                        if (
                            cancelled
                            || !guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers, true)
                        )
                            break;

                        counter++;
                        await guild.members.kick(member?.id, reason)
                            .then(() => kickeds.add(member?.id))
                            .catch(() => kickeds.add(member.id));

                        await int.editReply({ content: t("kick.kickning", { e, locale, member, counter }) });
                        await sleep(1500);
                    }

                    return await interaction.editReply({
                        content: t("kick.success", { e, locale, members, kickeds, unkickeds, reason }),
                        components: []
                    });
                })
                .on("end", async (_, reason): Promise<any> => {
                    if (["cancel", "kicked"].includes(reason)) return;
                    return await interaction.editReply({ content: t("kick.cancelled", { e, locale }), components: [] }).catch(() => { });
                });

            return;
        }
    }
};