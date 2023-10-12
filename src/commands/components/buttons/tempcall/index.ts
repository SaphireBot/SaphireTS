import { ButtonInteraction, PermissionsBitField } from "discord.js";
import enable from "./enable";
import disable from "./disable";
import reset from "./reset";
import muted from "./muted";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function tempcall(interaction: ButtonInteraction<"cached">, customData: { c: "tempcall", src: "enable" | "disable" | "muted" | "cancel" | "reset" }) {

    if (
        ![
            interaction.message?.interaction?.user?.id,
            interaction.message?.mentions?.repliedUser?.id
        ].includes(interaction.user.id)
    )
        return await interaction.reply({
            content: t("tempcall.you_cannot_click_here", { e, locale: interaction.userLocale }),
            ephemeral: true
        });

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return interaction.reply({
            content: t("tempcall.you_do_not_have_permissions", { e, locale: interaction.userLocale }),
            ephemeral: true
        });

    if (customData.src === "enable") return await enable(interaction);
    if (customData.src === "disable") return await disable(interaction);
    if (customData.src === "muted") return await muted(interaction);
    if (customData.src === "reset") return await reset(interaction);

    if (customData.src === "cancel")
        return await interaction.update({
            content: t("tempcall.cancelled", { e, locale: interaction.userLocale }),
            components: []
        });

    return await interaction.reply({
        content: "SUB_FUNCTION_NOT_FOUND #54654SADASD153"
    });
}