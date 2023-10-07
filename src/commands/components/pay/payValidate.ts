import { ButtonInteraction, ButtonStyle, ComponentType } from "discord.js";
import { PayManager } from "../../../managers";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Pay from "../../../structures/pay/pay";
import Database from "../../../database";

export default async function payValidate(interaction: ButtonInteraction<"cached">, customData: { c: "pay", src: "accept" | "cancel" }) {

    const { user, message, userLocale: locale } = interaction;
    const pay = PayManager.cache.get(message.id);

    if (!pay)
        return await interaction.update({
            content: t("pay.not_found", { e, locale }),
            components: []
        });

    if (!pay.isParticipant(user.id))
        return await interaction.reply({
            content: t("pay.is_not_for_you", { e, locale }),
            ephemeral: true
        });

    if (customData?.src === "accept") return accept(pay);
    if (customData?.src === "cancel") return cancel(pay);

    pay.delete(false);
    return await interaction.update({ content: t("pay.method_not_found", { e, locale }), components: [] });

    async function accept(pay: Pay) {

        const payerOrReceiver = pay.payer === user.id ? "receiver" : "payer";

        if (pay.payer === user.id && pay.confirm.payer)
            return await interaction.reply({
                content: t("pay.you_already_confirm", { e, locale, id: pay.receiver }),
                ephemeral: true
            });

        if (pay.receiver === user.id && pay.confirm.receiver)
            return await interaction.reply({
                content: t("pay.you_already_confirm", { e, locale, id: pay.payer }),
                ephemeral: true
            });

        await interaction.reply({ content: t("pay.savind_confirmation", { e, locale }), ephemeral: true });

        pay = await pay.validateConfirmation(user.id);

        await interaction.editReply({
            content:
                t(
                    pay.readyToValidate ? "pay.nice_nice" : "pay.confirmation_saved",
                    { e, locale, userId: pay[payerOrReceiver] }
                )
        });

        if (pay.readyToValidate)
            return pay.validate(interaction.message);

        await interaction.message.edit({
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: t("pay.components.confirm", {
                                confirms: 1,
                                locale: interaction.guild.preferredLocale
                            }),
                            emoji: e.MoneyWings.emoji(),
                            custom_id: JSON.stringify({ c: "pay", src: "accept" }),
                            style: ButtonStyle.Success
                        },
                        {
                            type: ComponentType.Button,
                            label: t("pay.components.cancel", interaction.guild.preferredLocale),
                            emoji: e.DenyX.emoji(),
                            custom_id: JSON.stringify({ c: "pay", src: "cancel" }),
                            style: ButtonStyle.Danger
                        }
                    ]
                }
            ]
        });

        return;
    }

    async function cancel(pay: Pay) {

        await interaction.reply({ content: t("pay.cancelling", { e, locale }), ephemeral: true });
        await pay.delete(false);

        const locales = await Database.Users.find({ id: { $in: [pay.payer, pay.receiver] } })
            .then(docs => docs.map(v => v?.locale))
            .catch(() => []);

        let content = "";
        if (locales[0] === locales[1])
            content += t("pay.cancelled", { e, locale: locales[0], pay, value: pay.value.currency() });
        else content += t("pay.cancelled", { e, locale: locales[0], pay, value: pay.value.currency() })
            + "\n"
            + t("pay.cancelled", { e, locale: locales[1], pay, value: pay.value.currency() });

        await interaction.editReply({ content: t("pay.success_cancelling", { e, locale }) });
        await interaction.message.edit({
            content,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: t("pay.components.cancelled", interaction.guild.preferredLocale),
                            custom_id: "disabled",
                            disabled: true,
                            style: ButtonStyle.Danger
                        }
                    ]
                }
            ]
        });
    }
}