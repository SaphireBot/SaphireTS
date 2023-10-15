import { time, ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, User } from "discord.js";
import client from "../../../saphire";
import { getLocalizations } from "../../../util/getlocalizations";
import { e } from "../../../util/json";
import { DiscordPermissons } from "../../../util/constants";
import { t } from "../../../translator";
import permissionsMissing from "../../functions/permissionsMissing";
import { filter } from "../../../database/cache";
import { setTimeout as sleep } from "node:timers/promises";
import { BanManager } from "../../../managers";

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
        name: "ban",
        name_localizations: getLocalizations("ban.name"),
        description: "[moderation] Just a simples command to ban someone",
        description_localizations: getLocalizations("ban.description"),
        default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
        dm_permission: false,
        nsfw: false,
        options: [
            {
                name: "users",
                name_localizations: getLocalizations("ban.options.0.name"),
                description: "A user to ban. Or, some users",
                description_localizations: getLocalizations("ban.options.0.description"),
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "time",
                name_localizations: getLocalizations("ban.options.1.name"),
                description: "How long time this member keep be banned",
                description_localizations: getLocalizations("ban.options.1.description"),
                type: ApplicationCommandOptionType.String,
                autocomplete: true
            },
            {
                name: "reason",
                name_localizations: getLocalizations("ban.options.2.name"),
                description: "The ban's reason",
                description_localizations: getLocalizations("ban.options.2.description"),
                type: ApplicationCommandOptionType.String,
                max_length: 512,
                min_length: 0
            },
            {
                name: "message_history",
                name_localizations: getLocalizations("ban.options.3.name"),
                description: "Delete message history (Seconds)",
                description_localizations: getLocalizations("ban.options.3.description"),
                type: ApplicationCommandOptionType.Integer,
                autocomplete: true
            }
        ]
    },
    additional: {
        category: "moderation",
        admin: false,
        staff: false,
        api_data: {
            name: "ban",
            description: "Um simples comando para banir",
            category: "Moderação",
            synonyms: [],
            tags: [],
            perms: {
                user: [DiscordPermissons.BanMembers],
                bot: [DiscordPermissons.BanMembers]
            }
        },
        async execute(interaction: ChatInputCommandInteraction<"cached">) {

            const { userLocale: locale, guild, options, user, guildId } = interaction;

            if (!interaction.member?.permissions.has(PermissionFlagsBits.BanMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

            if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
                return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_client_need_some_permissions");

            await interaction.reply({ content: t("ban.search_users", { e, locale }) });
            await guild.members.fetch();

            const queries = (options.getString("users") || "").split(/ /g);
            const users = new Map<string, User>();

            for await (const query of queries) {
                if (query.isUserId()) {
                    const user = await client.users.fetch(query);
                    if (user) users.set(user.id, user);
                }
                const user = guild.members.cache.find(t => filter(t, query))?.user;
                if (user) users.set(user?.id, user);
                continue;
            }

            if (!users?.size)
                return await interaction.editReply({ content: t("ban.no_users_found", { e, locale }) });

            let timeMs = options.getString("time")?.toDateMS();
            if (timeMs && timeMs < 5000) timeMs = 5000;

            const msg = await interaction.editReply({
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
            const reason = options.getString("reason") || t("ban.no_reason", { locale: guild.preferredLocale, user });
            const deleteMessageSeconds = options.getInteger("message_histroy") || 0;
            let counter = 0;
            let cancelled = false;

            const collector = msg.createMessageComponentCollector({
                filter: int => int.user.id === user.id,
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

                        return await guild.bans.create(user.id, { deleteMessageSeconds, reason })
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
                        await guild.bans.create(user?.id, { deleteMessageSeconds, reason })
                            .then(async () => {
                                banneds.add(user?.id);
                                if (typeof timeMs === "number" && timeMs > 0)
                                    await BanManager.set(guildId, user?.id, timeMs);
                            })
                            .catch(() => unbanneds.add(user.id));

                        await int.editReply({ content: t("ban.banning", { e, locale, users, counter }) });
                        await sleep(1500);
                    }

                    return await interaction.editReply({
                        content: t("ban.success", { e, locale, users, banneds, unbanneds, reason, time: timeMs ? t("ban.banned_until_day", { locale, time: time(new Date(Date.now() + timeMs), "F") + ` ${time(new Date(Date.now() + timeMs), "R")}` }) : t("ban.permanent", locale) }),
                        components: []
                    });
                })
                .on("end", async (_, reason): Promise<any> => {
                    if (["cancel", "banned"].includes(reason)) return;
                    return await interaction.editReply({ content: t("ban.cancelled", { e, locale }), components: [] }).catch(() => { });
                });

            return;
        }
    }
};