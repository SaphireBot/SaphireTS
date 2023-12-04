import { ButtonStyle } from "discord.js";
import { emojis } from ".";

export default function getButtons() {

    const choosenEmojis = emojis.random(25);

    /*
      A1 A2 A3 A4 A5 
      B1 B2 B3 B4 B5 
      C1 C2 C3 C4 C5 
      D1 D2 D3 D4 D5 
      E1 E2 E3 E4 E5 
     */

    const aButtons = { type: 2, components: [] as { type: 2, emoji: string, custom_id: string, style: number }[] };
    const bButtons = { type: 2, components: [] as { type: 2, emoji: string, custom_id: string, style: number }[] };
    const cButtons = { type: 2, components: [] as { type: 2, emoji: string, custom_id: string, style: number }[] };
    const dButtons = { type: 2, components: [] as { type: 2, emoji: string, custom_id: string, style: number }[] };
    const eButtons = { type: 2, components: [] as { type: 2, emoji?: string, custom_id: string, style: number, label?: string }[] };

    for (let i = 0; i < 5; i++)
        aButtons.components.push({ type: 2, emoji: choosenEmojis[i], custom_id: `a${i}`, style: ButtonStyle.Secondary });

    choosenEmojis.splice(0, 5);
    for (let i = 0; i < 5; i++)
        bButtons.components.push({ type: 2, emoji: choosenEmojis[i], custom_id: `b${i}`, style: ButtonStyle.Secondary });

    choosenEmojis.splice(0, 5);
    for (let i = 0; i < 5; i++)
        cButtons.components.push({ type: 2, emoji: choosenEmojis[i], custom_id: `c${i}`, style: ButtonStyle.Secondary });

    choosenEmojis.splice(0, 5);
    for (let i = 0; i < 5; i++)
        dButtons.components.push({ type: 2, emoji: choosenEmojis[i], custom_id: `d${i}`, style: ButtonStyle.Secondary });

    choosenEmojis.splice(0, 5);
    for (let i = 0; i < 4; i++)
        eButtons.components.push({ type: 2, emoji: choosenEmojis[i], custom_id: `e${i}`, style: ButtonStyle.Secondary });

    eButtons.components.push({ type: 2, label: "Start", custom_id: "init", style: ButtonStyle.Success });

    return [aButtons, bButtons, cButtons, dButtons, eButtons];
}