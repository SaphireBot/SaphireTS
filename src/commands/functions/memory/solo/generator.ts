import { ButtonStyle } from "discord.js";
import { buttonsIds } from "../util";

export default function generator(emojis: string[], isLimitedMode: boolean) {

    const dateNow = Date.now() + (1000 * 120);
    const components = [];
    const duplicate = [...emojis, ...emojis]
        .randomize()
        .map((emoji, i) => ({
            type: 2,
            emoji: "❔",
            custom_id: JSON.stringify(jsonData(i, emoji)),
            style: ButtonStyle.Secondary
        }));

    for (let i = 0; i < 4; i++)
        components.push({ type: 1, components: duplicate.splice(0, 5) });

    return { default: components.flat() };

    function jsonData(i: number, emoji: string) {

        const data = {
            c: "memory",
            src: { id: buttonsIds[i], e: emoji }
        };

        if (isLimitedMode)
            Object.assign(data.src, { d: dateNow });

        return data;
    }
}