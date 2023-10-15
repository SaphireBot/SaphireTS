import { Message, ButtonStyle, time, PermissionFlagsBits, User } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { BanManager } from "../../../managers";
import { setTimeout as sleep } from "node:timers/promises";
import Database from "../../../database";
import client from "../../../saphire";

export default {
    name: "ban",
    description: "Ban an user or some users",
    aliases: ["banir", "禁止する", "verbannen"],
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: ["banir", "禁止する", "verbannen"],
        tags: [],
        perms: {
            user: [DiscordPermissons.BanMembers],
            bot: [DiscordPermissons.BanMembers]
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { userLocale: locale, guild, author, guildId, member } = message;

        if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_client_need_some_permissions");

        if (!args?.length)
            return await message.reply({
                content: t("ban.no_args_mentioned", {
                    e,
                    locale,
                    prefix: (await Database.getPrefix(guildId))?.random(),
                    member,
                    client
                })
            });

        const msg = await message.reply({ content: t("ban.search_users", { e, locale }) });
        await guild.members.fetch();

        const queriesUsers = await message.getMultipleUsers() as User[];
        const users = new Map<string, User>();

        for (const user of queriesUsers)
            users.set(user.id!, user);

        if (!users?.size)
            return await msg.edit({ content: t("ban.no_users_found", { e, locale }) });

        let timeMs = message.content.toDateMS();
        if (timeMs && timeMs < 5000) timeMs = 5000;

        await msg.edit({
            content: t("ban.ask_for_the_ban", {
                e,
                locale,
                size: users.size,
                users: Array.from(users.values()).map(u => `\`${u?.username}\``).format(locale),
                time: timeMs ? t("ban.banned_until", { locale, time: `\`${Date.stringDate(timeMs, false, locale)}\`` }) : t("ban.permanent", locale),
                end: t("ban.until_end", { locale, time: time(new Date(Date.now() + 15000), "R") })
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

        const banneds = new Set<string>();
        const unbanneds = new Set<string>();
        let counter = 0;
        const reason = t("ban.banned_by", { locale: guild.preferredLocale, user: author });
        let cancelled = false;

        const collector = msg.createMessageComponentCollector({
            filter: int => int.user.id === author.id,
            time: 15000
        })
            .on("collect", async (int): Promise<any> => {
                const customId = int.customId;

                if (customId === "refuse") {
                    cancelled = true;
                    return collector.stop("refuse");
                }

                collector.stop("banned");
                await int.update({
                    content: t("ban.banning", { e, locale, users, counter }),
                    components: users.size > 1
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

                if (users.size === 1) {
                    const user = Array.from(users.values())?.[0];
                    if (typeof timeMs === "number" && timeMs > 0)
                        BanManager.set(guildId, user.id, timeMs);

                    return await guild.bans.create(user.id, { deleteMessageSeconds: 0, reason })
                        .then(async () => await int.editReply({
                            content: t("ban.user_banned", {
                                e,
                                locale,
                                user,
                                time: timeMs ? t("ban.banned_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }) : t("ban.permanent", locale),
                                reason
                            })
                        }))
                        .catch(async err => await int.editReply({
                            content: t("ban.fail", {
                                e,
                                locale,
                                user,
                                err: t(`Discord.Errors.${err.code}`, locale)
                            })
                        }));
                }

                collector.resetTimer({ time: 1000 * 60 * 50 });
                for await (const user of users.values()) {
                    if (cancelled) break;

                    if (
                        cancelled
                        || !guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true)
                    )
                        break;

                    counter++;
                    await guild.bans.create(user?.id, { deleteMessageSeconds: 0, reason })
                        .then(async () => {
                            banneds.add(user?.id);
                            if (typeof timeMs === "number" && timeMs > 0)
                                await BanManager.set(guildId, user?.id, timeMs);
                        })
                        .catch(() => unbanneds.add(user.id));

                    await int.editReply({ content: t("ban.banning", { e, locale, users, counter }) });
                    await sleep(1500);
                }

                return await msg.edit({
                    content: t("ban.success", { e, locale, users, banneds, unbanneds, reason, time: timeMs ? t("ban.banned_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }) : t("ban.permanent", locale) }),
                    components: []
                });
            })
            .on("end", async (_, reason): Promise<any> => {
                if (["cancel", "banned"].includes(reason)) return;
                return await msg.edit({ content: t("ban.cancelled", { e, locale }), components: [] }).catch(() => { });
            });

        return;
    }
};