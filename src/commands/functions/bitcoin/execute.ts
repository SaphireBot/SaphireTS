import { ChatInputCommandInteraction, Message, time } from "discord.js";
import Database from "../../../database";
import client from "../../../saphire";
import userdata from "./userdata";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import minebitcoin from "./minebitcoin";
import newbitcoin from "./newbitcoin";

export default async function name(
    interactionOrMessage: ChatInputCommandInteraction | Message,
    args?: string[]
) {

    const { userLocale: locale } = interactionOrMessage;
    const user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;
    const userId = "options" in interactionOrMessage
        ? interactionOrMessage.options.getUser("user")?.id || ""
        : (
            (await interactionOrMessage.getUser())?.id || ""
        ) || args?.[0] || "";

    const isReminder = "options" in interactionOrMessage
        ? interactionOrMessage.options.getString("reminder") === "yes"
        : false;

    // const user = await client.rest.get(
    //     Routes.user(userId)
    // ).catch(() => null);
    const userFetch = await client.users.fetch(userId).catch(() => null);
    if (userFetch?.id) return await userdata(interactionOrMessage, userFetch);

    const msg = await interactionOrMessage.reply({
        content: t("bitcoin.loading", { e, locale }),
        fetchReply: true
    });

    const data = await Database.getUser(user.id);
    const bits = data?.Perfil?.Bits || 0;
    const timeout = data?.Timeouts?.Bitcoin || 0;

    if (Date.timeout(7200000, timeout))
        return await msg.edit({
            content: t("bitcoin.farming", {
                e,
                locale,
                timestamp: time(new Date(timeout + 7200000), "R"),
                bits
            })
        });

    return bits >= 1000 ? newbitcoin(interactionOrMessage, msg, isReminder) : minebitcoin(interactionOrMessage, msg, user, isReminder);
}