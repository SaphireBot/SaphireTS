import { ButtonInteraction, ButtonStyle, Message } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";

export default async function disableAllButtons(
    win: boolean | null,
    int: ButtonInteraction<"cached"> | undefined,
    allButtons: any,
    choosenButtons: string[],
    emojis: string[],
    msg: Message,
    locale: string,
    buttons: any[],
    numbers: number
) {

    for (const button of allButtons) {
        button.disabled = true;

        if (choosenButtons.includes(button.custom_id)) {
            const index = choosenButtons.findIndex(d => d === button.custom_id);
            button.emoji = emojis[index];

            if (button.style !== ButtonStyle.Success)
                button.style = ButtonStyle.Danger;

        } else {
            button.style = win ? ButtonStyle.Primary : ButtonStyle.Danger;
            button.emoji = win ? e.Animated.SaphireDance : "❌";
        }
    }

    if (win === null)
        return await msg.edit({
            content: t("memory.sequency.idle", { e, locale }),
            components: buttons
        });

    const finishMessage = win
        ? t("memory.sequency.you_get_it", { e, locale, numbers })
        : t("memory.sequency.you_dont_get_it", { e, locale, numbers });

    return await int!.update({
        content: finishMessage,
        components: buttons
    }).catch(() => { });
}