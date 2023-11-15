import { ButtonStyle, Message, PermissionFlagsBits, time } from "discord.js";
import permissionsMissing from "../../functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { setTimeout as sleep } from "node:timers/promises";

export default {
    name: "mute",
    description: "A simple way to mute someone",
    aliases: ["tempmute", "silence", "silenciar"],
    category: "moderation",
    api_data: {
        category: "Um simples meio de mutar alguém",
        synonyms: ["tempmute", "silence", "silenciar"],
        tags: [],
        perms: {
            user: [DiscordPermissons.ModerateMembers],
            bot: [DiscordPermissons.ModerateMembers]
        }
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        const { userLocale: locale, guild, author } = message;

        if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.ModerateMembers], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.ModerateMembers], "Discord_client_need_some_permissions");

        const msg = await message.reply({ content: t("mute.search_members", { e, locale }) });
        await guild.members.fetch();

        const members = await message.getMultipleMembers();

        if (!members?.length)
            return await msg.edit({ content: t("mute.no_members_found", { e, locale }) });

        const timeMs = message.content?.toDateMS();

        if (!timeMs || timeMs <= 0)
            return await msg.edit({
                content: t("mute.date_not_valid", { e, locale })
            });

        if (members.length === 1 && members?.[0]?.id === author.id)
            return await msg.edit({
                content: t("ban.you_cannot_mute_you", { e, locale })
            });

        await msg.edit({
            content: t("mute.ask_for_the_mute", {
                e,
                locale,
                size: members.length,
                members: members.map(m => `\`${m?.displayName}\``).format(locale),
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
        let counter = 0;
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

                await int.update({
                    content: t("mute.muting", { e, locale, members: { size: members.length }, counter }),
                    components: members.length > 1
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
                                        label: t("keyword_cancel", locale),
                                        custom_id: "cancel",
                                        style: ButtonStyle.Success
                                    }
                                ]
                            }
                        ]
                        : []
                });

                if (members.length === 1) {
                    const member = members[0];

                    if (member)
                        member.disableCommunicationUntil(Date.now() + timeMs, `Mute By ${author.username}`)
                            .then(async () => await int.editReply({
                                content: t("mute.member_muted", {
                                    e,
                                    locale,
                                    member,
                                    time: t("mute.muted_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }),
                                    reason: `Mute By ${author.username}`
                                })
                            }))
                            .catch(async err => {
                                console.log(err);
                                await int.editReply({
                                    content: t("mute.fail", {
                                        e,
                                        locale,
                                        member,
                                        err: err?.message || "No Data Providen"
                                    })
                                });
                            });

                    return collector.stop("muted");
                }

                collector.resetTimer({ time: 1000 * 60 * 50 });
                for await (const member of members) {
                    if (cancelled) return;

                    if (!member?.id) continue;
                    if (
                        member.id === author.id
                        || member.permissions.has(PermissionFlagsBits.ModerateMembers, true)
                    ) {
                        unmuteds.add(member.id);
                        continue;
                    }

                    if (
                        cancelled
                        || !guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers, true)
                    )
                        break;

                    if (cancelled) return;
                    counter++;
                    await member.disableCommunicationUntil(Date.now() + timeMs, `Mute By ${author.username}`)
                        .then(() => muteds.add(member.id))
                        .catch(() => unmuteds.add(member.id));

                    if (cancelled) return;
                    await int.editReply({ content: t("mute.muting", { e, locale, members: { size: members.length }, counter }) });
                    await sleep(1500);
                }

                return await int.editReply({
                    content: t("mute.success", { e, locale, members: { size: members.length }, muteds, unmuteds, reason: `Mute By ${author.username}`, time: t("mute.muted_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }) }),
                    components: []
                });
            })
            .on("end", async (_, reason): Promise<any> => {
                if (["cancel", "muted"].includes(reason)) return;
                return await msg.edit({ content: t("mute.cancelled", { e, locale }), components: [] }).catch(() => { });
            });

        return;
    }
};