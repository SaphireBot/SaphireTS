import { ButtonInteraction } from "discord.js";
import { t } from "../../../../translator";

export default async (interaction: ButtonInteraction<"cached">, components: any[]) => {

    const { message, userLocale: locale } = interaction;
    if (!message) return;

    const allButtons = components.map(row => row.components).flat();

    for (const button of allButtons) {
        button.disabled = true;
        button.emoji = JSON.parse(button.custom_id).src.e;
    }

    interaction.deferUpdate().catch(() => { });
    return await message.edit({
        content: t("memory.solo.time_expired", locale),
        components
    }).catch(() => { });
};