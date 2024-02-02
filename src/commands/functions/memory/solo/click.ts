import { ButtonInteraction, ButtonStyle } from "discord.js";
import { MemoryCustomIdData, indexButton } from "../util";
import edit from "./edit";
import invalid from "./invalid";

export default async function soloClick(
    interaction: ButtonInteraction<"cached">,
    customIdData: MemoryCustomIdData
) {

    const { message } = interaction;
    const { id, d, e: emoji } = customIdData;
    const components = message.components.map(components => components.toJSON());
    const allButtons = components.map(row => row.components).flat();
    const row = components[indexButton[id]];
    const button = row.components.find(button => JSON.parse((button as any)?.custom_id).src.id === id) as any;

    if (d && d < Date.now()) return await invalid(interaction, components, message, true);

    button.disabled = true;
    button.emoji = emoji;
    button.style = ButtonStyle.Primary;

    const primaryButton = allButtons.filter(buttonData => (buttonData as any).style === ButtonStyle.Primary);
    const availableButtons = allButtons.filter(b => (b as any).style !== ButtonStyle.Success) as any;

    if (primaryButton?.length >= 3) {
        for (const button of availableButtons) {
            button.style = ButtonStyle.Secondary;
            button.emoji = "❔";
            button.disabled = false;
        }
        return edit(
            interaction,
            message,
            false,
            components
        );
    }

    if (primaryButton.length === 2) {

        const emoji1 = (primaryButton as any)[0]?.emoji?.name || (primaryButton as any)[0]?.emoji;
        const emoji2 = (primaryButton as any)[1]?.emoji?.name || (primaryButton as any)[1]?.emoji;

        if (emoji1 === emoji2) {
            (primaryButton as any)[0].style = ButtonStyle.Success;
            (primaryButton as any)[1].style = ButtonStyle.Success;
        } else {
            for (const button of availableButtons) button.disabled = true;
            setTimeout(async () => {
                for (const button of availableButtons) {
                    button.style = ButtonStyle.Secondary;
                    button.emoji = "❔";
                    button.disabled = false;
                }
                return await edit(
                    interaction,
                    message,
                    false,
                    components
                );
            }, 1000);
        }
    }

    return await edit(
        interaction,
        message,
        allButtons.every(b => (b as any).style === ButtonStyle.Success),
        components
    );

}