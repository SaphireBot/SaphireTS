import { ButtonInteraction } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default async function cancelVote(interaction: ButtonInteraction<"cached">, data?: { uid: string }) {

    const { userLocale: locale, user, message } = interaction;

    if (user.id !== data?.uid)
        return await interaction.reply({
            content: t("ping.you_cannot_click_here", { e, locale, username: `<@${data?.uid}>` }),
            ephemeral: true
        });

    await message.delete();
    return await interaction.reply({
        content: t("vote.canceled", { e, locale }),
        ephemeral: true
    });
}