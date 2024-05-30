import { Message, ButtonStyle, PermissionFlagsBits, GuildMember } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { setTimeout as sleep } from "node:timers/promises";
import Database from "../../../database";
import client from "../../../saphire";

export default {
    name: "kick",
    description: "Kick an user or some users",
    aliases: ["expulsar", "追い出す", "rausschmeißen", "expulser"],
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: ["expulsar", "追い出す", "rausschmeißen", "expulser"],
        tags: [],
        perms: {
            user: [DiscordPermissons.KickMembers],
            bot: [DiscordPermissons.KickMembers]
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, guild, author, guildId, member } = message;

        if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.KickMembers], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.KickMembers], "Discord_client_need_some_permissions");

        if (!args?.length)
            return await message.reply({
                content: t("kick.no_args_mentioned", {
                    e,
                    locale,
                    prefix: (await Database.getPrefix({ guildId: guildId }))?.random()!,
                    member,
                    client
                })
            });

        const msg = await message.reply({ content: t("kick.search_members", { e, locale }) });
        const members = await message.parseMemberMentions();

        if (!members?.size)
            return await msg.edit({ content: t("kick.no_members_found", { e, locale }) });

        let content = "";

        if (members.delete(client.user!.id))
            content += `${t("kick.saphire_kick", { e, locale })}\n`;

        if (members.delete(author.id))
            content += `${t("kick.you_cannot_kick_you", { e, locale })}\n`;

        const noPermissionsToKick = new Map<string, GuildMember>();

        if (guild.ownerId !== author.id)
            for (const member of members.values())
                if (
                    message.member.roles.highest.comparePositionTo(member.roles.highest) >= 1
                    || member.permissions.has(PermissionFlagsBits.KickMembers, true)
                ) {
                    noPermissionsToKick.set(member.id, member);
                    members.delete(member.id);
                }

        if (noPermissionsToKick.size)
            content += `${t("kick.noPermissionsToKickMembers", { e, locale, members: noPermissionsToKick.size })}\n`;

        if (!members.size && content.length)
            return await msg.edit({ content });

        await msg.edit({
            content: content += t("kick.ask_for_the_kick", {
                e,
                locale,
                size: members.size,
                members: Array.from(members.values()).map(m => `\`${m?.displayName}\``).format(locale)
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
        let counter = 0;
        const reason = t("kick.kicked_by", { locale: guild.preferredLocale, user: author });
        let cancelled = false;

        const collector = msg.createMessageComponentCollector({
            filter: int => int.user.id === author.id,
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
                        .catch(() => unkickeds.add(member.id));

                    await int.editReply({ content: t("kick.kicking", { e, locale, members, counter }) });
                    await sleep(1500);
                }

                return await msg.edit({
                    content: t("kick.success", { e, locale, members, kickeds, unkickeds, reason }),
                    components: []
                });
            })
            .on("end", async (_, reason): Promise<any> => {
                if (["cancel", "kicked"].includes(reason)) return;
                return await msg.edit({ content: t("kick.cancelled", { e, locale }), components: [] }).catch(() => { });
            });

        return;
    }
};