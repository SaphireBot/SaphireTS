import { Message, ButtonStyle } from "discord.js";
import { t } from "../../../../translator";

export default async function disable(message: Message<true>) {

    const trueMessage = await message.fetch();
    if (!trueMessage) return;

    const components = trueMessage.components.map(components => components.toJSON());
    const allButtons = components.map((row: any) => row.components).flat();

    const allGreen = allButtons.every(b => (b as any)?.style === ButtonStyle.Success);
    if (allGreen) return;

    for (const button of allButtons) {
        button.disabled = true;
        (button as any).emoji = JSON.parse((button as any).custom_id).src.e;
    }

    return await message.edit({
        content: t("memory.solo.time_expired", message.userLocale),
        components,
    })
        .catch(() => { });

}