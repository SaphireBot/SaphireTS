import { ButtonInteraction } from "discord.js";
import Database from "../../../../database";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function disabled(
    interaction: ButtonInteraction<"cached">,
    { id, uid }: { c: "jkp", type: "disabled", id: string, uid: string },
) {

    const { user, userLocale: locale } = interaction;

    if (user.id !== uid)
        return await interaction.reply({
            content: t("jokempo.disable_you_cannot_use_it", { e, locale }),
            ephemeral: true,
        });

    await interaction.update({
        content: t("jokempo.canceling", { e, locale }),
        components: [],
    });

    const exists = await Database.Jokempo.exists({ id });
    if (!exists?._id) return await interaction.message?.delete().catch(() => { });

    const jokempo = await Database.Jokempo.findOneAndUpdate(
        { id },
        {
            $unset: {
                opponentId: true,
                channelId: true,
                messageId: true,
            },
        },
        { new: true, upsert: true },
    ).catch(() => { });

    if (!jokempo)
        return await interaction.editReply({
            content: t("jokempo.another_error", { e, locale }),
        });

    await Database.editBalance(
        user.id,
        {
            createdAt: new Date(),
            keywordTranslate: "jokempo.transactions.refund",
            method: "add",
            mode: "jokempo",
            type: "system",
            value: jokempo.value || 0,
        });

    return await interaction.editReply({
        content: t("jokempo.canceled", { e, locale }),
    });
}