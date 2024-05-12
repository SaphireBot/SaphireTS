import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import createReminder from "../reminder/create";

export default async function newbitcoin(
    interactionOrMessage: ChatInputCommandInteraction | Message,
    msg: Message,
    isReminder: boolean
) {

    await Database.editBalance(
        interactionOrMessage.id,
        {
            createdAt: new Date(),
            keywordTranslate: "bitcoin.transactions.gain",
            method: "add",
            mode: "bitcoin",
            type: "gain",
            value: 5000000
        }
    );

    if (isReminder)
        await createReminder(interactionOrMessage, {
            dm: true,
            interval: 0,
            message: "bitcoin.reminder",
            time: "2h",
            originalMessage: undefined,
            isAutomatic: true
        });

    return await msg.edit({
        content: t("bitcoin.success", { e, locale: interactionOrMessage.userLocale }),
        embeds: []
    });
}