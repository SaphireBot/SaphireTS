import { ButtonInteraction, ChannelType, Collection, GuildMember, PermissionFlagsBits } from "discord.js";
import { TempcallManager } from "../../../../managers";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import Database from "../../../../database";
import { tempcallOptions } from "../buttons.get";

export default async function enable(interaction: ButtonInteraction<"cached">) {

    const { guildId, userLocale: locale, guild, member } = interaction;

    if (!member.permissions.has(PermissionFlagsBits.Administrator))
        return await interaction.reply({
            content: t("tempcall.you_do_not_have_permissions", { e, locale }),
            ephemeral: true
        });

    if (TempcallManager.guildsId.has(guildId))
        return await interaction.update({
            content: t("tempcall.already_enabled", { e, locale }),
            components: []
        }).catch(() => { });

    TempcallManager.guildsId.add(guildId);
    await interaction.update({ content: t("tempcall.loading", { e, locale }), components: [] }).catch(() => { });

    if (!TempcallManager.inCall[guildId])
        TempcallManager.inCall[guildId] = {};

    if (!TempcallManager.inMute[guildId])
        TempcallManager.inMute[guildId] = {};

    const guildData = await Database.Guilds.findOneAndUpdate(
        { id: guildId },
        { $set: { "TempCall.enable": true } },
        { new: true }
    );

    await guild.members.fetch();

    let membersInCall = 0;
    guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildVoice && channel.members?.size)
        .forEach(channel => {
            const channelsMembersId = (channel.members as Collection<string, GuildMember>).filter(member => !member.user?.bot).map(member => member.user.id);
            membersInCall += channelsMembersId.length;
            for (const memberId of channelsMembersId)
                TempcallManager.inCall[guildId][memberId] = Date.now();
        });

    const data = {
        enable: guildData?.TempCall?.enable || false,
        muteTime: guildData?.TempCall?.muteTime || false
    };

    return interaction.editReply({
        content: t("tempcall.enabled", { e, locale, membersInCall: membersInCall > 0 ? t("tempcall.already_counting", { e, locale, membersInCall }) : "" }),
        components: tempcallOptions(data, locale)
    });
}