import { GiveawayManager } from "../../../../managers";
import { APIActionRowComponent, APIButtonComponent } from "discord.js";
const messagesToEditButton = <Record<string, boolean>>{};

export default async function refreshButton(giveawayId: string) {
    if (messagesToEditButton[giveawayId]) return;
    messagesToEditButton[giveawayId] = true;
    return setTimeout(() => edit(), 2500);

    async function edit() {
        const gw = GiveawayManager.cache.get(giveawayId);
        delete messagesToEditButton[giveawayId];
        if (!gw?.Actived) return;
        const message = await gw.channel?.messages.fetch(giveawayId).catch(() => null);
        const components = message?.components[0]?.toJSON() as APIActionRowComponent<APIButtonComponent>;
        if (!components ||!message?.editable) return;
        components.components[0].label = `Participar (${gw.Participants.size || "0"})`;
        components.components[0].disabled = components.components[0]?.disabled || false;
        return message.edit({ components: [components] });
    }
}