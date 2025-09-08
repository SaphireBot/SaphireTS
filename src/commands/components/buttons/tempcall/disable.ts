import { ButtonInteraction, PermissionsBitField, MessageFlags } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { TempcallManager } from "../../../../managers";
import Database from "../../../../database";
import { tempcallOptions } from "../buttons.get";

export default async function enable(interaction: ButtonInteraction<"cached">) {

    const { guildId, member, userLocale: locale } = interaction;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("tempcall.you_do_not_have_permissions", { e, locale }),
        });

    await interaction.update({ content: t("tempcall.turning_off", { e, locale }), components: [] });

    delete TempcallManager.inCall[guildId];
    delete TempcallManager.inMute[guildId];
    if (!TempcallManager.guildsId.has(guildId))
        return await interaction.editReply({ content: t("tempcall.already_disabled", { e, locale }) });

    TempcallManager.guildsId.delete(guildId);

    const guildData = await Database.Guilds.findOneAndUpdate(
        { id: guildId },
        {
            $set: {
                "TempCall.enable": false,
                "TempCall.muteTime": false,
            },
        },
        { new: true, upsert: true, fields: "TempCall" },
    );

    const data = {
        enable: guildData?.TempCall?.enable || false,
        muteTime: guildData?.TempCall?.muteTime || false,
    };

    return await interaction.editReply({
        content: t("tempcall.disabled", { e, locale }),
        components: tempcallOptions(data, locale),
    });
}