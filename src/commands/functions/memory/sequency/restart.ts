import { Message } from "discord.js";

export default async function restartButtons(msg: Message, allButtons: any, buttons: any[]) {

    for (const button of allButtons) {
        button.disabled = false;
        if (button.emoji !== "❔") button.emoji = "❔";
    }

    return await msg.edit({ components: buttons }).catch(() => { });
}