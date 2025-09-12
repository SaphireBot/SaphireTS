import { GiveawayManager } from "../../../../managers";
import { APIActionRowComponent, APIButtonComponent } from "discord.js";
import { t } from "../../../../translator";
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

        if (!components || !message?.editable) return;
        if ("label" in components.components[0])
            components.components[0].label = t("giveaway.join", { locale: gw.guild?.preferredLocale, participants: gw.Participants.size });
        components.components[0].disabled = components.components[0]?.disabled || false;

        return await message.edit({ components: [components] })
            .catch(err => console.log(err, components));
    }
}