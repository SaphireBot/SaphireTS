import {
    APIEmbed,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
    ChannelSelectMenuInteraction,
    ChatInputCommandInteraction,
    Colors,
    ForumChannel,
    MentionableSelectMenuInteraction,
    Message, NewsChannel,
    PrivateThreadChannel,
    PublicThreadChannel,
    RoleSelectMenuInteraction,
    StageChannel,
    StringSelectMenuInteraction,
    TextChannel,
    UserSelectMenuInteraction,
    VoiceChannel,
} from "discord.js";
import { e } from "../../../../util/json";
import register from "./register";
import { GiveawayCollectorData } from "../../../../@types/commands";
import Modals from "../../../../structures/modals";
import { GiveawayType } from "../../../../@types/models";
import { t } from "../../../../translator";

export default async function enableButtonCollector(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    embed: APIEmbed,
    collectorData: GiveawayCollectorData,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    GiveawayResetedData?: GiveawayType,
    color?: number | undefined,
) {

    const user = interaction.user;
    let locale = interaction.userLocale;
    editContent();

    const components = () => [
        {
            type: 1,
            components: [
                {
                    type: 6,
                    custom_id: "roles",
                    placeholder: t("giveaway.components.roles", locale),
                    min_values: 0,
                    max_values: 25,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 6,
                    custom_id: "locked_roles",
                    placeholder: t("giveaway.components.locked_roles", locale),
                    min_values: 0,
                    max_values: 25,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 5,
                    custom_id: "members",
                    placeholder: t("giveaway.components.members", locale),
                    min_values: 0,
                    max_values: 25,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 5,
                    custom_id: "locked_members",
                    placeholder: t("giveaway.components.locked_members", locale),
                    min_values: 0,
                    max_values: 25,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("giveaway.components.lauch", locale),
                    emoji: "📨",
                    custom_id: "lauch",
                    style: ButtonStyle.Success,
                },
                {
                    type: 2,
                    label: t("giveaway.components.cancel", locale),
                    emoji: "✖️",
                    custom_id: "cancel",
                    style: ButtonStyle.Danger,
                },
                {
                    type: 2,
                    label: t("giveaway.components.switchRoles", locale),
                    emoji: "🔄",
                    custom_id: "switchRoles",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: t("giveaway.components.addRoles", locale),
                    emoji: "👑",
                    custom_id: "addRoles",
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    label: t("giveaway.components.multiJoins", locale),
                    emoji: "✨",
                    custom_id: "multiJoins",
                    style: ButtonStyle.Primary,
                },
            ],
        },
    ].asMessageComponents();

    await configurationMessage.edit({ content: null, embeds: [embed], components: components() })
        .catch(async err => await interaction.channel?.send({ content: t("giveaway.error_to_edit_principal_message", { e, locale, err }) }));

    const buttonCollector = configurationMessage.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: 1000 * 60 * 5,
    })
        .on("collect", async (int): Promise<any> => collect(int))
        .on("end", (_, reason): any => end(reason));

    function editContent(botRole?: boolean, memberBot?: boolean | "UserAlreadySelected", extra?: boolean | "RoleAlreadySelected" | "UserAlreadySelected", addRolesInvalid?: boolean) {
        const locale = interaction.userLocale;
        embed.description = t("giveaway.choose_users_roles_send_or_cancel", locale);
        if (embed.fields) {

            embed.fields[0].value = t("giveaway.emoji_saved", { e, locale });

            embed.fields[1] = {
                name: collectorData.RequiredAllRoles ? t("giveaway.require_roles", locale) : t("giveaway.only_one_roles", locale),
                value: collectorData.AllowedRoles.length > 0 || botRole || extra
                    ? `${collectorData.AllowedRoles.map(roleId => `<@&${roleId}>`).join(", ") || t("giveaway.no_role_selected_n", locale)}` + `${botRole ? t("giveaway.bot_role_selected", { e, locale }) : ""}` + `${extra === "RoleAlreadySelected" ? t("giveaway.same_role_in_two_fields", { e, locale }) : ""}`
                    : t("giveaway.no_role_selected", locale),
            };

            embed.fields[2] = {
                name: t("giveaway.locked_roles", locale),
                value: collectorData.LockedRoles.length > 0 || botRole || extra
                    ? `${collectorData.LockedRoles.map(roleId => `<@&${roleId}>`).join(", ") || t("giveaway.get_away_with_roles", locale)}` + `${botRole ? t("giveaway.bot_role_selected", { e, locale }) : ""}` + `${extra === "RoleAlreadySelected" ? t("giveaway.same_role_in_two_fields", { e, locale }) : ""}`
                    : t("giveaway.get_away_with_roles", locale),
            };

            embed.fields[3] = {
                name: t("giveaway.allowed_members", locale),
                value: collectorData.AllowedMembers.length > 0 || memberBot || extra
                    ? `${collectorData.AllowedMembers.map(userId => `<@${userId}>`).join(", ") || t("giveaway.only_these_members", locale)}` + `${memberBot ? t("giveaway.a_bot_was_selected", { e, locale }) : ""}` + `${memberBot === "UserAlreadySelected" ? t("same_user_in_two_fields", locale) : ""}`
                    : t("giveaway.only_these_members", locale),
            };

            embed.fields[4] = {
                name: t("giveaway.users_locked_name", locale),
                value: collectorData.LockedMembers.length > 0 || memberBot || extra
                    ? `${collectorData.LockedMembers.map(userId => `<@${userId}>`).join(", ") || t("giveaway.users_locked", locale)}` + `${memberBot ? t("giveaway.a_bot_was_selected", { e, locale }) : ""}` + `${memberBot === "UserAlreadySelected" ? t("same_user_in_two_fields", locale) : ""}`
                    : t("giveaway.users_locked", locale),
            };

            embed.fields[5] = {
                name: t("giveaway.role_to_winners", locale),
                value: addRolesInvalid
                    ? t("giveaway.no_permissions_to_manager_a_role", locale)
                    : collectorData.AddRoles.length > 0
                        ? `${collectorData.AddRoles.map(roleId => `<@&${roleId}>`).join(", ") || t("giveaway.no_role_setted", locale)}`
                        : t("giveaway.roles_to_setted_to_winners", locale),
            };

            embed.fields[6] = {
                name: t("giveaway.multiple_entrance", locale),
                value: collectorData.MultJoinsRoles.size > 0
                    ? `${Array.from(collectorData.MultJoinsRoles.values()).map(role => `**${role.joins || 1}x** <@&${role.role.id}>`).join("\n") || t("giveaway.no_role_setted", locale)}`
                    : t("giveaway.roles_with_entrances", locale),
            };

        }

        return;
    }

    async function collect(int: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | UserSelectMenuInteraction<"cached"> | RoleSelectMenuInteraction<"cached"> | MentionableSelectMenuInteraction<"cached"> | ChannelSelectMenuInteraction<"cached">) {

        const { customId } = int;
        locale = int.userLocale;

        if (customId === "lauch") {
            buttonCollector.stop();
            await int.update({ content: t("giveaway.loading_new_giveaway", { e, locale }), embeds: [], components: [] });
            return await register(
                interaction,
                configurationMessage,
                giveawayMessage,
                collectorData,
                channel,
                color,
                GiveawayResetedData,
            );
        }

        if (customId === "cancel") {
            buttonCollector.stop();
            giveawayMessage.delete();
            return await int.update({ content: t("giveaway.all_canceled", { e, locale }), embeds: [], components: [] });
        }

        if (customId === "switchRoles") {
            collectorData.RequiredAllRoles = !collectorData.RequiredAllRoles;
            const message = int.message;

            if (embed.fields) {
                embed.fields[1].name = collectorData.RequiredAllRoles
                    ? "🔰 " + t("giveaway.components.switchRoles", locale)
                    : t("giveaway.just_one_role", locale);
            }

            const components = message.components.map(comp => comp.toJSON()) as any;

            components[4].components[2].label = collectorData.RequiredAllRoles
                ? t("giveaway.components.switchRoles", locale)
                : t("giveaway.just_one_role_without_emoji", locale);

            return await int.update({ components, embeds: [embed] });
        }

        if (customId === "roles") {
            if (!int.isAnySelectMenu()) return;

            if (int.values.some(roleId => collectorData.LockedRoles.includes(roleId))) {
                editContent(false, false, "RoleAlreadySelected");
                return await int.update({ content: null, embeds: [embed] });
            }

            collectorData.AllowedRoles = int.values;
            editContent();
            return await int.update({ content: null, embeds: [embed] });
        }

        if (customId === "addRolesSelect") {
            if (!int.isAnySelectMenu()) return;
            if (int.values.some(roleId => interaction.guild?.roles.cache.get(roleId)?.managed)) {
                editContent(false, false, false, true);
                return await int.update({ content: null, embeds: [embed] });
            }

            collectorData.AddRoles = int.values;
            editContent();
            return await int.update({ content: null, embeds: [embed] });
        }

        if (customId === "addMultiJoinsRolesSelect") {
            if (!int.isAnySelectMenu()) return;
            const roles = collectorData.MultJoinsRoles;
            collectorData.MultJoinsRoles.clear();

            for (const roleId of int.values) {
                const role = interaction.guild?.roles.cache.get(roleId);
                if (role) {
                    const setted = roles.get(roleId) || { role, joins: 0 };
                    setted.joins = setted.joins || 1;
                    collectorData.MultJoinsRoles.set(roleId, setted);
                }
            }

            editContent();
            return await int.update({ content: null, embeds: [embed] });
        }

        if (customId === "locked_roles") {
            if (!int.isAnySelectMenu()) return;

            if (int.values.some(roleId => interaction.guild?.roles.cache.get(roleId)?.managed)) {
                editContent(true);
                return await int.update({ content: null, embeds: [embed] });
            }

            if (int.values.some(roleId => collectorData.AllowedRoles.includes(roleId))) {
                editContent(false, false, "RoleAlreadySelected");
                return await int.update({ content: null, embeds: [embed] });
            }

            collectorData.LockedRoles = int.values;
            editContent();
            return await int.update({ content: null, embeds: [embed] });
        }

        if (customId === "members") {
            if (!int.isAnySelectMenu()) return;

            if (int.values.some(memberId => interaction.guild?.members.cache.get(memberId)?.user?.bot)) {
                editContent(false, true);
                return await int.update({ content: null, embeds: [embed] });
            }

            if (int.values.some(memberId => collectorData.LockedMembers.includes(memberId))) {
                editContent(false, "UserAlreadySelected");
                return await int.update({ content: null, embeds: [embed] });
            }

            collectorData.AllowedMembers = int.values;
            editContent();
            return await int.update({ content: null, embeds: [embed] });
        }

        if (customId === "locked_members") {
            if (!int.isAnySelectMenu()) return;

            if (!int.isAnySelectMenu()) return;

            if (int.values.some(memberId => interaction.guild?.members.cache.get(memberId)?.user?.bot)) {
                editContent(false, true);
                return await int.update({ content: null, embeds: [embed] });
            }

            if (int.values.some(memberId => collectorData.AllowedMembers.includes(memberId))) {
                editContent(false, false, "UserAlreadySelected");
                return await int.update({ content: null, embeds: [embed] });
            }

            collectorData.LockedMembers = int.values;
            editContent();
            return await int.update({ content: null, embeds: [embed] });
        }

        if (customId === "addRoles")
            return await int.update({
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 6,
                                custom_id: "addRolesSelect",
                                placeholder: t("giveaway.role_to_winners_without_emoji", locale),
                                min_values: 0,
                                max_values: 25,
                            },
                        ],
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("giveaway.components.lauch", locale),
                                emoji: "📨",
                                custom_id: "lauch",
                                style: ButtonStyle.Success,
                            },
                            {
                                type: 2,
                                label: t("giveaway.components.cancel", locale),
                                emoji: "✖️",
                                custom_id: "cancel",
                                style: ButtonStyle.Danger,
                            },
                            {
                                type: 2,
                                label: t("giveaway.components.cancel", locale),
                                emoji: "👥",
                                custom_id: "BackToAddRoles",
                                style: ButtonStyle.Primary,
                            },
                        ],
                    },
                ].asMessageComponents(),
            });

        if (customId === "multiJoins")
            return await int.update({
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 6,
                                custom_id: "addMultiJoinsRolesSelect",
                                placeholder: t("giveaway.components.multiJoins", locale),
                                min_values: 0,
                                max_values: 5,
                            },
                        ],
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: t("giveaway.components.lauch", locale),
                                emoji: "📨",
                                custom_id: "lauch",
                                style: ButtonStyle.Success,
                            },
                            {
                                type: 2,
                                label: t("giveaway.components.cancel", locale),
                                emoji: "✖️",
                                custom_id: "cancel",
                                style: ButtonStyle.Danger,
                            },
                            {
                                type: 2,
                                label: t("giveaway.components.BackToAddRoles", locale),
                                emoji: "👥",
                                custom_id: "BackToAddRoles",
                                style: ButtonStyle.Primary,
                            },
                            {
                                type: 2,
                                label: t("giveaway.components.DefineJoins", locale),
                                emoji: "📝",
                                custom_id: "DefineJoins",
                                style: ButtonStyle.Primary,
                            },
                        ],
                    },
                ].asMessageComponents(),
            });

        if (customId === "BackToAddRoles")
            return await int.update({ components: components() });

        if (customId === "DefineJoins") {
            const roles = Array.from(collectorData.MultJoinsRoles.values());

            if (!collectorData.MultJoinsRoles.size)
                return await int.reply({
                    content: t("giveaway.no_roles_setted", { e, locale }),
                    ephemeral: true,
                });

            return await int.showModal(Modals.giveawayDefineMultJoins(roles))
                .then(() => int.awaitModalSubmit({
                    filter: i => i.user.id === user.id,
                    time: 1000 * 60 * 5,
                })
                    .then(async modalSubmit => {

                        const { fields } = modalSubmit;

                        let warnOverLimit = false;
                        for (const [roleId, r] of collectorData.MultJoinsRoles.entries()) {
                            const value = Number(fields.getTextInputValue(roleId));
                            if (isNaN(value) || value < 1 || value > 100) {
                                warnOverLimit = true;
                                continue;
                            }

                            r.joins = value;
                            collectorData.MultJoinsRoles.set(roleId, r);
                        }

                        editContent();
                        await modalSubmit.deferUpdate();
                        if (warnOverLimit)
                            await interaction.followUp({ content: t("giveaway.modal_values_limits", { e, locale }), ephemeral: true });
                        return await modalSubmit.editReply({ content: null, embeds: [embed] });

                    })
                    .catch(() => { }));
        }
        return;
    }

    async function end(reason: string) {
        if (["user"].includes(reason)) return;

        giveawayMessage.delete();
        if (reason === "messageDelete") {
            return await interaction.channel?.send({
                content: t("giveaway.message_deleted_into_configuration", { e, locale }),
                components: [],
            });
        }

        if (["time", "limit", "idle"].includes(reason)) {
            embed.color = Colors.Red;
            if (embed.fields)
                embed.fields.push({
                    name: t("giveaway.eternity", locale),
                    value: t("giveaway.rest_in_peace", { e, locale }),
                });
            embed.footer = { text: t("giveaway.expired", locale) };
            return await configurationMessage.edit({ content: null, embeds: [embed], components: [] });
        }
    }

    return;
}