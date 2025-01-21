import { BaseInteraction, ButtonStyle, Interaction, Message } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import client from "../../saphire";

export default async function permissionsMissing(
    interactionOrMessage: Interaction | Message,
    permissions: string[],
    key: "Discord_you_need_some_permissions" | "Discord_client_need_some_permissions",
) {
    if (
        !interactionOrMessage
        || !permissions?.length
        || !key
    ) return;

    const components: any[] = [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("keyword_permissons_informations", interactionOrMessage.userLocale),
                    style: ButtonStyle.Link,
                    url: "https://support.discord.com/hc/pt-br/articles/206029707-Como-configurar-permiss%C3%B5es",
                },
            ],
        },
    ];

    const content = t(key, {
        e,
        locale: interactionOrMessage.userLocale,
        permissions: permissions.map(perm => `**${t(`Discord.Permissions.${perm}`, interactionOrMessage?.userLocale)}**`).join(", "),
    });

    if (interactionOrMessage instanceof Message) {
        if (interactionOrMessage.author?.id === client.user?.id)
            return await interactionOrMessage.edit({ content, embeds: [], components });

        return await interactionOrMessage.reply({ content, components });
    }

    if (interactionOrMessage instanceof BaseInteraction) {
        if (interactionOrMessage.isAutocomplete())
            return await interactionOrMessage.respond([]);

        if (interactionOrMessage.deferred || interactionOrMessage.replied) {
            if (interactionOrMessage.isMessageComponent() || interactionOrMessage.isModalSubmit())
                return await interactionOrMessage.followUp({ content, ephemeral: true, components });

            return await interactionOrMessage.editReply({ content, embeds: [], components});
        }

        return await interactionOrMessage.reply({ content, ephemeral: true, components });
    }
}