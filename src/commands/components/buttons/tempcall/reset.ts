import { ButtonInteraction, MessageFlags, PermissionsBitField } from "discord.js";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function reset(interaction: ButtonInteraction<"cached">) {

    const { userLocale: locale, member, guildId } = interaction;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: t("tempcall.you_do_not_have_permissions", { e, locale }),
        });

    await interaction.update({
        content: t("tempcall.reseting", { e, locale }),
        components: [],
    });

    await Database.Guilds.updateOne(
        { id: guildId },
        { $unset: { "TempCall.members": true } },
    );

    return await interaction.editReply({
        content: t("tempcall.reseted", { e, locale }),
    }).catch(() => { });

}