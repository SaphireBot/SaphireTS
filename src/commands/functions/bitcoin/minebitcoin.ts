import { ChatInputCommandInteraction, Message, User, time } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import createReminder from "../reminder/create";

export default async function minebitcoin(
    interactionOrMessage: ChatInputCommandInteraction | Message,
    msg: Message,
    user: User,
    isReminder: boolean,
) {

    const { userLocale: locale } = interactionOrMessage;
    const data = await Database.Users.findOneAndUpdate(
        { id: user.id },
        {
            $inc: { "Perfil.Bits": 1 },
            $set: { "Timeouts.Bitcoin": Date.now() + 7200000 },
        },
        { upsert: true, new: true },
    );

    let content = t("bitcoin.one_bit", {
        e,
        locale,
        bits: data?.Perfil?.Bits || 0,
        timestamp: time(new Date(Date.now() + 7200000), "R"),
    });

    if (isReminder) {
        await createReminder(interactionOrMessage, {
            dm: true,
            interval: 0,
            message: "bitcoin.reminder",
            time: "2h",
            originalMessage: undefined,
            isAutomatic: true,
        });
        content += `\n${t("bitcoin.reminder_enable", locale)}`;
    }

    const payload = { content, embeds: [] };
    return await msg.edit(payload)
        .catch(async () => {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                return await interactionOrMessage.followUp(payload)
                    .catch(() => { });
        });
}