import { ChatInputCommandInteraction, Colors, Message, User } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function userdata(
    interactionOrMessage: ChatInputCommandInteraction | Message,
    user: User,
) {

    if (!user) return;

    const { userLocale: locale } = interactionOrMessage;
    let msg: Message<boolean> | null | undefined = null;

    if (interactionOrMessage instanceof ChatInputCommandInteraction)
        msg = await interactionOrMessage.reply({
            content: t("bitcoin.loading", { e, locale }),
            withResponse: true,
        }).then(res => res.resource?.message);

    if (interactionOrMessage instanceof Message)
        msg = await interactionOrMessage.reply({ content: t("bitcoin.loading", { e, locale }) });

    if (!msg) return;

    const data = await Database.getUser(user.id);

    if (!data)
        return await msg.edit({ content: t("bitcoin.no_data_found", { e, locale }) });

    const farm = data?.Perfil?.Bits || 0;
    const bitcoins = data?.Perfil?.Bitcoins || 0;

    return await msg.edit({
        content: null,
        embeds: [{
            color: Colors.Gold,
            author: {
                name: user?.username || "username?",
                icon_url: user?.displayAvatarURL() || undefined,
            },
            fields: [
                {
                    name: "Bitcoins",
                    value: `${e.BitCoin} ${bitcoins}`,
                    inline: true,
                },
                {
                    name: "Farm",
                    value: `${e.BitCoin} \`${farm}/1000\``,
                    inline: true,
                },
            ],
        }],
    }).catch(() => null);
}