import { ButtonStyle } from "discord.js";
import { buttonsIds } from "../util";

export default (emojis: string[], memberId: string) => {

    const components = [];
    const duplicate = [...emojis, ...emojis]
        .shuffle()
        .map((emoji, i) => ({
            type: 2,
            emoji: "❔",
            custom_id: JSON.stringify({
                c: "memory",
                src: {
                    id: buttonsIds[i],
                    e: emoji,
                    mId: memberId
                }
            }),
            style: ButtonStyle.Secondary
        }));

    for (let i = 0; i < 4; i++)
        components.push({ type: 1, components: duplicate.splice(0, 5) });

    return components.flat();
};