import Giveaway from "../../../../structures/giveaway/giveaway";
import { ButtonInteraction, ButtonStyle } from "discord.js";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { GuildSchema } from "../../../../database/models/guild";
import disableButton from "./disableButton";
import refreshButton from "./refreshButton";
import { t } from "../../../../translator";

export default async function join(interaction: ButtonInteraction<"cached">, giveaway: Giveaway) {

    const { user, member, userLocale: locale } = interaction;

    await interaction.reply({
        content: t("giveaway.join_in", { e, locale }),
        ephemeral: true
    });

    if (giveaway.lauched) {
        disableButton(interaction.message);
        return interaction.editReply({ content: t("giveaway.ended", { e, locale }) }).catch(() => { });
    }

    if (giveaway.Participants.has(user.id))
        return interaction.editReply({
            content: t("giveaway.already_in", { e, locale, participants: (giveaway.Participants.size - 1).currency() }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("giveaway.leave", { locale }),
                            emoji: e.Leave,
                            custom_id: JSON.stringify({ c: "giveaway", src: "leave", gwId: giveaway.MessageID }),
                            style: ButtonStyle.Danger
                        },
                        {
                            type: 2,
                            label: t("giveaway.left_tho", { locale }),
                            emoji: "🫠",
                            custom_id: JSON.stringify({ c: "giveaway", src: "ignore" }),
                            style: ButtonStyle.Success
                        }
                    ]
                }
            ].asMessageComponents()
        });

    if (giveaway.MinAccountDays > 0) {
        const accountDays = Math.floor((Date.now() - user?.createdTimestamp) / (1000 * 60 * 60 * 24));

        if (giveaway.MinAccountDays > accountDays)
            return interaction.editReply({
                content: t("giveaway.account_not_enough", {
                    e,
                    locale,
                    accountDays: accountDays.currency(),
                    MinAccountDays: giveaway.MinAccountDays.currency(),
                    MinAccountDaysDiference: (giveaway.MinAccountDays - accountDays).currency()
                })
            });
    }

    if (giveaway.MinInServerDays > 0) {
        const inServerDays = Math.floor((Date.now() - (member?.joinedTimestamp || 0)) / (1000 * 60 * 60 * 24));

        if (giveaway.MinInServerDays > inServerDays)
            return interaction.editReply({
                content: t("giveaway.account_server_not_enough", {
                    e,
                    locale,
                    inServerDays: inServerDays.currency(),
                    MinInServerDays: giveaway.MinInServerDays.currency(),
                    MinInServerDaysDifference: (giveaway.MinInServerDays - inServerDays).currency()
                })
            });
    }

    let hasRole = false;

    if (giveaway.AllowedRoles?.length && !giveaway.AllowedMembers.includes(user.id)) {

        if (giveaway.RequiredAllRoles) {
            if (!member.roles.cache.hasAll(...giveaway.AllowedRoles))
                return interaction.editReply({
                    content: t("giveaway.requiredAllRoles", {
                        e,
                        locale,
                        roles: giveaway.AllowedRoles.filter(roleId => !member.roles.cache.has(roleId)).map(roleId => `<@&${roleId}>`).join(", ")
                    })
                });
        }
        else
            if (!member.roles.cache.hasAny(...giveaway.AllowedRoles))
                return interaction.editReply({
                    content: t("giveaway.just_one_role_is_needed", {
                        e,
                        locale,
                        roles: giveaway.AllowedRoles.map(roleId => `<@&${roleId}>`).join(", ")
                    })
                });
        hasRole = true;
    }

    if (giveaway.LockedRoles?.length && !giveaway.AllowedMembers.includes(user.id)) {
        if (member.roles.cache.hasAny(...giveaway.LockedRoles))
            return interaction.editReply({
                content: t("giveaway.locked_roles_any", {
                    e,
                    locale,
                    roles: giveaway.LockedRoles.filter(roleId => member.roles.cache.has(roleId)).map(roleId => `<@&${roleId}>`).join(", ") || "??"
                })
            });
    }

    if (giveaway.AllowedMembers?.length && !giveaway.AllowedMembers?.includes(user.id) && !hasRole)
        return interaction.editReply({
            content: t("giveaway.you_cannot_join", { e, locale })
        });

    if (giveaway.LockedMembers?.includes(user.id))
        return interaction.editReply({
            content: t("giveaway.you_are_locked", { e, locale })
        });

    giveaway.addParticipant(user.id);
    return await Database.Guilds.findOneAndUpdate(
        { id: interaction.guild.id, "Giveaways.MessageID": giveaway.MessageID },
        { $addToSet: { "Giveaways.$.Participants": user.id } },
        { new: true, upsert: true }
    )
        .then(doc => success(doc.toObject()))
        .catch(err => interaction.editReply({ content: t("giveaway.error_to_join", { e, locale, err }) }));

    async function success(doc: GuildSchema) {
        const giveawayObject = doc.Giveaways?.find(gw => gw.MessageID === giveaway.MessageID);

        if (!giveawayObject) {
            giveaway.delete();
            return interaction.editReply({
                content: t("giveaway.not_found_database", { e, locale })
            });
        }

        const participants = giveaway.addParticipants(giveawayObject.Participants);
        refreshButton(giveaway.MessageID);
        const phrase = [1, 2, 3, 4];

        if (giveaway.lauched) disableButton(interaction.message);
        return await interaction.editReply({
            content: `${e.Animated.SaphireDance} | ${t(`giveaway.phrase${phrase.random()}`, { locale, participants: participants.size })}\n${t("giveaway.just_wait", { e, locale })}`
        });
    }

}