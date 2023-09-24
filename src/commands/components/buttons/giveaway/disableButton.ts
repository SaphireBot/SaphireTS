import { Message } from "discord.js";

export default async function disableButton(message: Message<true>, both = false) {
    const components = message?.components[0]?.toJSON();
    if (!components) return;
    components.components[0].disabled = true;
    components.components[1].disabled = both;
    return await message.edit({ components: [components] });
}