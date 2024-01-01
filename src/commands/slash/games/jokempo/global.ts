import { ButtonStyle, ChatInputCommandInteraction, Colors, Message } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import client from "../../../../saphire";
import { JokempoValues } from "../../../../util/constants";

export default async function global(
    interactionOrMessage: ChatInputCommandInteraction | Message
) {

    const { userLocale: locale } = interactionOrMessage;
    const user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;

    return await interactionOrMessage.reply({
        embeds: [{
            color: Colors.Green,
            title: t("jokempo.global.embeds.0.title", { locale, e, client }),
            description: t("jokempo.global.embeds.0.description", { locale, e }),
            fields: [
                {
                    name: t("jokempo.global.embeds.0.fields.0.name", locale),
                    value: t("jokempo.global.embeds.0.fields.0.value", locale)
                },
                {
                    name: t("jokempo.global.embeds.0.fields.1.name", { locale, e }),
                    value: t("jokempo.global.embeds.0.fields.1.value", locale)
                },
                {
                    name: t("jokempo.global.embeds.0.fields.2.name", locale),
                    value: t("jokempo.global.embeds.0.fields.2.value", { locale, values: JokempoValues.map(n => `\`${n.currency()}\``).join(", ") })
                },
                {
                    name: t("jokempo.global.embeds.0.fields.3.name", locale),
                    value: t("jokempo.global.embeds.0.fields.3.value", locale)
                }
            ]
        }],
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("jokempo.global.components.0.label", locale),
                    emoji: "📨",
                    custom_id: JSON.stringify({ c: "jkp", type: "send", uid: user.id }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: t("jokempo.global.components.1.label", locale),
                    emoji: e.Taxa,
                    custom_id: JSON.stringify({ c: "jkp", type: "bet", uid: user.id }),
                    style: ButtonStyle.Primary
                },
            ]
        }].asMessageComponents()
    });

}