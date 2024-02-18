import { ButtonStyle } from "discord.js";
import { ButtonObject } from "../../@types/customId";
import { e } from "../../util/json";
let defaultButtons: any = false;

export default function loadingButtons(): any {

    if (defaultButtons) return defaultButtons;

    const loading = e.Loading;

    const rawComponents = Array(5)
        .fill(1)
        .map(() => ({
            type: 1,
            components: []
        })) as ButtonObject[];

    let customId = 0;
    for (const { components } of rawComponents)
        for (let x = 0; x <= 4; x++) {
            components.push({
                type: 2,
                emoji: loading,
                custom_id: `${customId++}`,
                style: ButtonStyle.Secondary,
                disabled: true
            });
        }

    defaultButtons = rawComponents;
    return rawComponents;
}