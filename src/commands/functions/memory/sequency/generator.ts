import { ButtonStyle } from "discord.js";


export default function getMemoryButtons() {

    const defaultEmoji = "❔";

    /*
      A1 A2 A3 A4 A5 
      B1 B2 B3 B4 B5 
      C1 C2 C3 C4 C5 
      D1 D2 D3 D4 D5 
      E1 E2 E3 E4 E5 
     */

    const aButtons = { type: 1, components: [] as any[] };
    const bButtons = { type: 1, components: [] as any[] };
    const cButtons = { type: 1, components: [] as any[] };
    const dButtons = { type: 1, components: [] as any[] };
    const eButtons = { type: 1, components: [] as any[] };

    for (let i = 1; i < 6; i++) {
        aButtons.components.push({ type: 2, emoji: defaultEmoji, custom_id: `a${i}`, style: ButtonStyle.Secondary, disabled: true });
        bButtons.components.push({ type: 2, emoji: defaultEmoji, custom_id: `b${i}`, style: ButtonStyle.Secondary, disabled: true });
        cButtons.components.push({ type: 2, emoji: defaultEmoji, custom_id: `c${i}`, style: ButtonStyle.Secondary, disabled: true });
        dButtons.components.push({ type: 2, emoji: defaultEmoji, custom_id: `d${i}`, style: ButtonStyle.Secondary, disabled: true });
        eButtons.components.push({ type: 2, emoji: defaultEmoji, custom_id: `e${i}`, style: ButtonStyle.Secondary, disabled: true });
    }

    return [aButtons, bButtons, cButtons, dButtons, eButtons].asMessageComponents();
}