import { ButtonStyle } from "discord.js";
import { ButtonObject } from "../../@types/customId";
import { e } from "../../util/json";
import Lastclick from "./lastlclick";
const emojisDefault = ["🐐", "🦣", "🐍", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🙈", "🐵", "🐸", "🐨", "🐒", "🦁", "🐯", "🐮", "🐔", "🐧", "🐦", "🐤", "🦄", "🐴", "🐗", "🐺", "🦇", "🦉", "🦅", "🦤", "🦆", "🐛", "🦋", "🐌", "🐝", "🪳", "🪲", "🦗", "🦂", "🐢"];

export default function loadButtons(game: Lastclick): any[] {

    const emojis = new Set<string>(emojisDefault);

    const rawComponents = [
        {
            type: 1,
            components: []
        },
        {
            type: 1,
            components: []
        },
        {
            type: 1,
            components: []
        },
        {
            type: 1,
            components: []
        }
    ] as ButtonObject[];

    for (const { components } of rawComponents)
        for (let x = 0; x <= 4; x++) {
            const emoji = random();
            components.push({
                type: 2,
                emoji,
                custom_id: emoji,
                style: ButtonStyle.Secondary
            });
        }

    const lastRow = {
        type: 1,
        components: [
            {
                type: 2,
                emoji: "🏃🏻‍♀️",
                custom_id: "leave",
                style: ButtonStyle.Primary
            },
            {
                type: 2,
                emoji: e.DenyX,
                custom_id: "cancel",
                style: ButtonStyle.Danger
            },
            {
                type: 2,
                emoji: e.CheckV,
                custom_id: "start",
                style: ButtonStyle.Success
            }
        ] as any[]
    };

    for (let x = 0; x <= 1; x++) {
        const emoji = random();
        lastRow.components.unshift({
            type: 2,
            emoji,
            custom_id: emoji,
            style: ButtonStyle.Secondary
        });
    }

    rawComponents.push(lastRow);
    return rawComponents;

    function random() {
        const emoji = Array.from(emojis).random();
        game.customIds.add(emoji);
        emojis.delete(emoji);
        return emoji;
    }
}