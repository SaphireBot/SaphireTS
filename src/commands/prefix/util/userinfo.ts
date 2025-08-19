import { codeBlock, ButtonInteraction, Role, time, APIEmbed, Message, Colors, PermissionsBitField, StringSelectMenuInteraction, parseEmoji } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { applicationRPCData } from "../../../@types/commands";
import { getPaginationButtons } from "../../components/buttons/buttons.get";
import { Flags as flags, urls } from "../../../util/constants";

export default {
    name: "userinfo",
    description: "See informations about an user",
    aliases: ["ui", "ユーザー情報"],
    category: "util",
    api_data: {
        category: "Utilidades",
        synonyms: [],
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message<true>, _: string[] | undefined) {

        const { userLocale, guild, author } = message;
        let locale = userLocale || "en-US";

        if (message.partial) await message.fetch().catch(() => { });
        const user = (await message.parseUserMentions()).first() || message.author;

        const msg = await message.reply({ content: t("userinfo.loading", { e, locale }) });

        let embeds: Record<string, APIEmbed> = {};
        let rolesPaginationEmbeds: APIEmbed[] = [];
        let rolesPagitionsCollector: any = undefined;
        let rolesPaginationIndex = 0;
        const userflags = user?.flags?.toArray() || [];
        let member = guild ? await guild.members.fetch(user.id) : undefined;
        const doNotHave = t("userinfo.do_not_have", locale);

        function components() {
            return [{
                type: 1,
                components: [{
                    type: 3,
                    custom_id: "menu",
                    placeholder: t("userinfo.select_menu.placeholder", locale),
                    options: [
                        {
                            label: t("userinfo.select_menu.options.0.label", locale),
                            emoji: "👤",
                            description: t("userinfo.select_menu.options.0.description", locale),
                            value: "user",
                        },
                    ],
                }],
            }];
        }

        const comps = components();
        await formatUserData();
        await formatMemberData(comps);
        await formatMemberRoles(comps);
        await formatMemberPermissions(comps);
        if (user.bot) await formatApplicationData(comps);
        refreshOption(comps);

        await msg.edit({
            content: null,
            embeds: [embeds.user],
            components: comps,
        });

        return msg.createMessageComponentCollector({
            filter: int => int.user.id === author.id,
            idle: 1000 * 60 * 5,
        })
            .on("collect", async (int: ButtonInteraction | StringSelectMenuInteraction): Promise<any> => {

                if (int.isButton()) return;

                if (rolesPagitionsCollector)
                    rolesPagitionsCollector.stop();

                const refreshLocale = await int.user.locale() || "en-US";
                if (refreshLocale !== locale) {
                    locale = refreshLocale;
                    return await refresh(int);
                }

                const value = int.values[0];

                if (value === "refresh") return await refresh(int);
                if (value === "roles") return await rolesPagination(int);
                return await int.update({ embeds: [embeds[value]] as APIEmbed[], components: comps });
            })
            .on("end", async (): Promise<any> => await msg.edit({ components: [] }));

        async function refresh(int: StringSelectMenuInteraction) {

            await int.update({
                content: t("userinfo.refreshing", { e, locale, user }),
                embeds: [],
                components: [],
            });

            let comps = components();
            await user.fetch();
            if (member) member = await guild.members.fetch(user.id).catch(() => undefined);
            embeds = {};
            await formatUserData();
            comps = await formatMemberData(comps);
            comps = await formatMemberRoles(comps);
            comps = await formatMemberPermissions(comps);
            if (user.bot) comps = await formatApplicationData(comps);
            comps = await refreshOption(comps);

            return await int.editReply({
                content: null,
                embeds: [embeds["user"]],
                components: comps,
            });
        }

        async function formatUserData() {

            const data = {
                flags: userflags.length > 0
                    ? userflags
                        .filter(i => typeof i === "string")
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        .map(flag => e[flag] || flags[flag] || `\`${flag}\``)
                        .join(" ") || doNotHave
                    : doNotHave,
                system: user.system ? t("userinfo.system", locale) : "",
                bot: user.bot ? t("userinfo.botsystem", locale) : "",
                type: user.bot ? t("userinfo.bot", locale) : user.system ? t("userinfo.system", locale) : t("userinfo.user", locale),
                accountCreated: time(user.createdAt, "F"),
                accountCreatedFor: time(user.createdAt, "R"),
                identification: `🆔 ${t("userinfo.id", locale)} \`${user.id}\`` + `\n🌐 ${t("userinfo.globalName", locale)} \`${user.globalName || doNotHave}\`` + `\n🧩 ${t("userinfo.tag", locale)} \`${user.username}\`` + `${member ? `\n📝 ${t("userinfo.displayName", locale)} \`${member?.displayName || doNotHave}\`` : ""}`,
            };

            embeds["user"] = {
                color: Colors.Blue,
                title: t(
                    user.id === author.id ? "userinfo.my_informations" : "userinfo.informations_from_user",
                    { e, locale, user },
                ),
                url: `https://discord.com/users/${user.id}`,
                fields: [
                    {
                        name: t("userinfo.identification", locale),
                        value: data.identification,
                    },
                    {
                        name: t("userinfo.generic", locale),
                        value: `${t("userinfo.type", { locale, data })}\n${t("userinfo.flags", { locale, data })}\n${t("userinfo.createdAt", { locale, data })}\n${t("userinfo.createdAtFor", { locale, data })}`.limit("EmbedFieldValue"),
                    },
                ],
                thumbnail: { url: user.avatarURL() as string },
            };
            return;
        }

        async function formatMemberData(components: any) {
            if (!member?.id) return;

            components[0].components[0].options.push({
                label: t("userinfo.select_menu.options.1.label", locale),
                emoji: "📃",
                description: t("userinfo.select_menu.options.1.description", { locale, member }),
                value: "member",
            });

            const data = [
                `🏷️ ${member.displayName} | ${member.toString()}`,
                guild.ownerId === member.id ? t("userinfo.guild.owner", { locale, e }) : "",
                member.permissions?.has(PermissionsBitField.Flags.Administrator)
                    ? t("userinfo.guild.admin", { locale, e })
                    : "",
                t("userinfo.guild.color", { locale, member }),
                t(
                    member.pending ? "userinfo.guild.pending" : "userinfo.guild.not_pending",
                    { locale, e },
                ),
                t("userinfo.guild.joinedAt", {
                    locale,
                    e,
                    date: time(member.joinedAt as Date, "F"),
                }),
                t("userinfo.guild.joinSince", {
                    locale,
                    e,
                    dateDetailed: Date.stringDate(Date.now() - (member.joinedTimestamp as number), false, locale),
                    date: time(member.joinedAt as Date, "R"),
                }),
                member.communicationDisabledUntil
                    ? t("userinfo.guild.communicationDisabledUntil", {
                        locale,
                        date: `${time(member.communicationDisabledUntil)}`,
                    })
                    : "",
                member.voice?.channel
                    ? t("userinfo.guild.on_voice", { locale, channel: member.voice.channel?.toString() })
                    : "",
            ];

            embeds["member"] = {
                color: member.displayColor || Colors.Blue,
                title: t(
                    user.id === author.id ? "userinfo.my_informations_guild" : "userinfo.informations_from_user_guild",
                    { e, locale, user },
                ),
                url: `https://discord.com/users/${user.id}`,
                description: Object.values(data).filter(Boolean).join("\n"),
                thumbnail: { url: member.displayAvatarURL() },
            };

            return components;
        }

        async function formatApplicationData(components: any) {

            components[0].components[0].options.push({
                label: t("userinfo.select_menu.options.4.label", locale),
                emoji: "🤖",
                description: t("userinfo.select_menu.options.4.description", { locale, user }),
                value: "application",
            });

            const data = await fetch(
                `https://discord.com/api/v10/applications/${user.id}/rpc`,
                { method: "GET" },
            )
                .then(res => res.json())
                .catch(() => null) as applicationRPCData | null;

            if (!data || data?.code === 10002 || data?.message === "Unknown Application") {
                embeds["application"] = {
                    color: Colors.Blue,
                    title: t("userinfo.application.information_about_application", { e, locale, user }),
                    url: `https://discord.com/users/${user.id}`,
                    description: t("userinfo.application.no_data_found", { locale, e, user }),
                    image: {
                        url: urls.not_found_image,
                    },
                };

                return components;
            }

            const applicationFlags = data.flags;
            const hasGatewayPresence = (applicationFlags & (1 << 12)) !== 0;
            const hasGuildMembers = (applicationFlags & (1 << 14)) !== 0;
            const hasGatewayMessageContent = (applicationFlags & (1 << 18)) !== 0;

            const toFormatData: string[] = [];
            const keys = ["id", "name", "guild_id", "terms_of_service_url", "privacy_policy_url", "custom_install_url"];
            for (const k of keys)
                if (k in data)
                    toFormatData.push(
                        t(`userinfo.application.${k}`, { e, locale, data, user }),
                    );

            const toFormatDataBoolean: string[] = [
                t("userinfo.application.public", { emoji: data.bot_public ? e.CheckV : e.DenyX, locale }),
                t("userinfo.application.interactions_endpoint_url", { emoji: data.interactions_endpoint_url ? e.CheckV : e.DenyX, locale }),
                t("userinfo.application.bot_require_code_grant", { emoji: data.bot_require_code_grant ? e.CheckV : e.DenyX, locale }),
                t("userinfo.application.presence", { emoji: hasGatewayPresence ? e.CheckV : e.DenyX, locale }),
                t("userinfo.application.guildMembers", { emoji: hasGuildMembers ? e.CheckV : e.DenyX, locale }),
                t("userinfo.application.messageContent", { emoji: hasGatewayMessageContent ? e.CheckV : e.DenyX, locale }),
            ];

            const embed = {
                color: member?.displayColor || Colors.Blue,
                title: t("userinfo.application.information_about_application", { e, locale, user }),
                url: `https://discord.com/users/${user.id}`,
                description: "",
                fields: [
                    {
                        name: t("userinfo.application.general_informations", { e, locale }),
                        value: toFormatData.join("\n").limit("EmbedFieldValue"),
                    },
                    {
                        name: t("userinfo.application.more_informations", { e, locale }),
                        value: toFormatDataBoolean.join("\n").limit("EmbedFieldValue"),
                    },
                    {
                        name: t("userinfo.application.verify", locale),
                        value: t("userinfo.application.http_request_verification_public_key", { locale, data }),
                    },
                ],
            };

            if (data.description)
                embed.description = data.description;

            embeds["application"] = embed;
            return;
        }

        async function formatMemberRoles(components: any) {
            if (!member?.id) return;

            const roles = member.roles.cache.toJSON();
            const title = t("userinfo.guild.roles_title", { e, locale, member });

            components[0].components[0].options.push({
                label: t("userinfo.select_menu.options.2.label", locale),
                emoji: "💼",
                description: t("userinfo.select_menu.options.2.description", { locale, user }),
                value: "roles",
            });

            if (roles?.length === 1) {
                embeds["roles"] = {
                    color: member?.displayColor || Colors.Blue,
                    title,
                    image: {
                        url: urls.not_found_image,
                    },
                };

                return components;
            }

            rolesPaginationEmbeds = EmbedGenerator(roles.sort((a, b) => b.position - a.position));

            return components;

            function EmbedGenerator(array: Role[]) {

                const embeds = [];
                let amount = 10;
                let page = 1;
                const length = array.length / 10 <= 1 ? 1 : (array.length / 10) + 1;

                for (let i = 0; i < array.length; i += 10) {

                    const current = array.slice(i, amount);
                    const description = current.map((role, x) => `${i + (x + 1)}. ${role.toString()} \`${role.id}\``).join("\n");
                    const pageCount = length > 1 ? ` ${page}/${length.toFixed(0)}` : "";

                    embeds.push({
                        color: member?.displayColor || Colors.Blue,
                        title: title + pageCount,
                        url: `https://discord.com/users/${user.id}`,
                        description,
                    });

                    page++;
                    amount += 10;
                }

                return embeds;
            }
        }

        async function formatMemberPermissions(components: any) {
            if (!member?.id) return components;

            components[0].components[0].options.push({
                label: t("userinfo.select_menu.options.5.label", locale),
                emoji: e.plus,
                description: t("userinfo.select_menu.options.5.description", locale),
                value: "permissions",
            });

            const permissions = member.permissions.toArray();
            const permissionsFormat = (() => {
                if (user.id === guild.ownerId) return t("userinfo.guild.is_the_owner", { e, user, locale });
                return permissions.map(perm => `${t(`Discord.Permissions.${perm}`, locale)}`).join("\n");
            })();

            embeds["permissions"] = {
                color: member.displayColor || Colors.Blue,
                title: t("userinfo.guild.all_permissions", { e, member, locale, permissionsLength: permissions.length }),
                url: `https://discord.com/users/${user.id}`,
                description: user.id === guild.ownerId ? permissionsFormat : codeBlock("txt", permissionsFormat).limit("EmbedDescription"),
            };

            if (!permissions?.length) {
                delete embeds["permissions"].description;
                embeds["permissions"].image = {
                    url: urls.not_found_image,
                };
            }

            return components;
        }

        async function rolesPagination(int: StringSelectMenuInteraction) {

            if (!rolesPaginationEmbeds?.length)
                return await int.update({
                    embeds: [{
                        color: Colors.Blue,
                        title: t("userinfo.guild.roles_title", { e, locale, member }),
                        image: {
                            url: urls.not_found_image,
                        },
                    }],
                });

            if (rolesPagitionsCollector) rolesPagitionsCollector.stop();

            const components = [int.message.components?.[0]?.toJSON()];

            if (rolesPaginationEmbeds.length > 1)
                components.unshift(...getPaginationButtons());

            await int.update({
                embeds: [rolesPaginationEmbeds[rolesPaginationIndex]],
                components,
            });

            if (rolesPaginationEmbeds?.length <= 1) return;
            rolesPagitionsCollector = int.message.createMessageComponentCollector({
                filter: i => i.user.id === author.id,
                idle: 1000 * 60 * 5,
            })
                .on("collect", async (int): Promise<any> => {

                    locale = await int.user.locale() || "en-US";
                    const { customId } = int;

                    switch (customId) {
                        case "zero": rolesPaginationIndex = 0; break;
                        case "left": rolesPaginationIndex = rolesPaginationIndex <= 0 ? rolesPaginationEmbeds?.length - 1 : rolesPaginationIndex - 1; break;
                        case "right": rolesPaginationIndex = rolesPaginationIndex >= rolesPaginationEmbeds?.length - 1 ? 0 : rolesPaginationIndex + 1; break;
                        case "last": rolesPaginationIndex = rolesPaginationEmbeds?.length - 1; break;

                        default:
                            break;
                    }

                    return await int.update({ embeds: [rolesPaginationEmbeds[rolesPaginationIndex]] });
                });

            return;
        }

        function refreshOption(components: any) {
            if (!components?.length) return;
            components[0]
                .components[0]
                .options.push({
                    label: t("userinfo.select_menu.options.3.label", locale),
                    emoji: parseEmoji("🔄") as any,
                    description: t("userinfo.select_menu.options.3.description", locale),
                    value: "refresh",
                });

            return components;
        }
    },
};