import { ButtonInteraction, ChannelType, PermissionFlagsBits, Collection, GuildMember, MessageFlags } from "discord.js";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import { TempcallManager } from "../../../../managers";
import { tempcallOptions } from "../buttons.get";

export default async function muted(interaction: ButtonInteraction<"cached">) {

    const { guildId, userLocale: locale, guild, member } = interaction;

    if (!member.permissions.has(PermissionFlagsBits.Administrator))
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("tempcall.you_do_not_have_permissions", { e, locale }),
        });

    if (!TempcallManager.guildsId.has(guildId))
        return await interaction.update({
            content: t("tempcall.it_need_be_enabled", { e, locale }),
            components: [],
        }).catch(() => { });

    await interaction.update({ content: t("tempcall.loading", { e, locale }), components: [] }).catch(() => { });

    const state = !TempcallManager.guildsWithMuteCount.has(guildId);

    if (TempcallManager.guildsWithMuteCount.has(guildId))
        TempcallManager.guildsWithMuteCount.delete(guildId);
    else TempcallManager.guildsWithMuteCount.add(guildId);

    guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildVoice && channel.members?.size)
        .forEach(channel => (channel.members as Collection<string, GuildMember>)
            .forEach(member => {
                if (!member.user.bot) {
                    if (
                        state
                        && (
                            member.voice.selfMute
                            || member.voice.selfDeaf
                            || member.voice.serverMute
                            || member.voice.serverDeaf
                        )
                    )
                        mutedUser(member.user.id);
                    else inCallUser(member.user.id);
                }
            }));

    const guildData = await Database.Guilds.findOneAndUpdate(
        { id: guildId },
        { $set: { "TempCall.muteTime": state } },
        { new: true, upsert: true, fields: "TempCall" },
    );

    const data = {
        enable: guildData?.TempCall?.enable || false,
        muteTime: guildData?.TempCall?.muteTime || false,
    };

    return await interaction.editReply({
        content: data.muteTime
            ? t("tempcall.enable_mute", { e, locale })
            : t("tempcall.disabled_mute", { e, locale }),
        components: tempcallOptions(data, locale),
    });

    async function inCallUser(memberId: string) {
        delete TempcallManager.inMute[guildId][memberId];
        if (!TempcallManager.inCall[guildId]) TempcallManager.inCall[guildId] = {};
        if (!TempcallManager.inCall[guildId][memberId])
            TempcallManager.inCall[guildId][memberId] = Date.now();
    }

    async function mutedUser(memberId: string) {
        delete TempcallManager.inCall[guildId][memberId];
        if (!TempcallManager.inMute[guildId]) TempcallManager.inMute[guildId] = {};
        if (!TempcallManager.inMute[guildId][memberId])
            TempcallManager.inMute[guildId][memberId] = Date.now();
    }

}