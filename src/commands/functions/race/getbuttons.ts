import { ButtonObject } from "../../../@types/customId";
import { ButtonStyle, ComponentType } from "discord.js";
import { t } from "../../../translator";

export default function getButtons(emojis: string[], locale: string): ButtonObject[] {

    /*
      A1 A2 A3 A4 A5 
      B1 B2 B3 B4 B5 
      C1 C2 C3 C4 C5 
      D1 D2 D3 D4 D5 
      E1 E2 E3 E4 E5 
     */

    const aButtons: ButtonObject = { type: ComponentType.ActionRow, components: [] };
    const bButtons: ButtonObject = { type: ComponentType.ActionRow, components: [] };
    const cButtons: ButtonObject = { type: ComponentType.ActionRow, components: [] };
    const dButtons: ButtonObject = { type: ComponentType.ActionRow, components: [] };
    const eButtons: ButtonObject = { type: ComponentType.ActionRow, components: [] };

    for (let i = 0; i < 5; i++)
        aButtons.components.push({ type: ComponentType.Button, emoji: emojis[i], custom_id: `a${i}`, style: ButtonStyle.Secondary });

    emojis.splice(0, 5);
    for (let i = 0; i < 5; i++)
        bButtons.components.push({ type: ComponentType.Button, emoji: emojis[i], custom_id: `b${i}`, style: ButtonStyle.Secondary });

    emojis.splice(0, 5);
    for (let i = 0; i < 5; i++)
        cButtons.components.push({ type: ComponentType.Button, emoji: emojis[i], custom_id: `c${i}`, style: ButtonStyle.Secondary });

    emojis.splice(0, 5);
    for (let i = 0; i < 5; i++)
        dButtons.components.push({ type: ComponentType.Button, emoji: emojis[i], custom_id: `d${i}`, style: ButtonStyle.Secondary });

    emojis.splice(0, 5);
    for (let i = 0; i < 4; i++)
        eButtons.components.push({ type: ComponentType.Button, emoji: emojis[i], custom_id: `e${i}`, style: ButtonStyle.Secondary });

    eButtons.components.push({ type: ComponentType.Button, label: t("race.buttons.start", locale), custom_id: "start", style: ButtonStyle.Success });

    return [aButtons, bButtons, cButtons, dButtons, eButtons];
}