import { BaseInteraction, Interaction, Message } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";

export default async function permissionsMissing(
    interactionOrMessage: Interaction | Message,
    permissions: string[],
    key: "Discord_you_need_some_permissions" | "Discord_client_need_some_permissions"
) {
    if (
        !interactionOrMessage
        || !permissions?.length
        || !key
    ) return;

    const content = t(key, {
        e,
        locale: interactionOrMessage.userLocale,
        permissions: permissions.map(perm => `**${t(`Discord.Permissions.${perm}`, interactionOrMessage?.userLocale)}**`).join(", ")
    });

    if (interactionOrMessage instanceof Message) {
        if (interactionOrMessage.author?.id === client.user?.id)
            return await interactionOrMessage.edit({ content, embeds: [], components: [] });

        return await interactionOrMessage.reply({ content });
    }

    if (interactionOrMessage instanceof BaseInteraction) {
        if (interactionOrMessage.isAutocomplete())
            return await interactionOrMessage.respond([]);

        if (interactionOrMessage.deferred || interactionOrMessage.replied) {
            if (interactionOrMessage.isMessageComponent() || interactionOrMessage.isModalSubmit())
                return await interactionOrMessage.followUp({ content, ephemeral: true });

            return await interactionOrMessage.editReply({ content, embeds: [], components: [] });
        }

        return await interactionOrMessage.reply({ content, ephemeral: true });
    }
}