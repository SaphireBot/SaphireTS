import { ChatInputCommandInteraction, Message, time } from "discord.js";
import Database from "../../../database";
import userdata from "./userdata";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import minebitcoin from "./minebitcoin";
import newbitcoin from "./newbitcoin";
import replyAndGetMessage from "../../../util/replyAndGetMessage";

export default async function bitcoin(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
) {

    const { userLocale: locale } = interactionOrMessage;
    const author = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;
    const user = "options" in interactionOrMessage
        ? interactionOrMessage.options.getUser("user")
        : await (async () => {
            if (interactionOrMessage.partial) await interactionOrMessage.fetch().catch(() => { });
            return (await interactionOrMessage.parseUserMentions()).first();
        })();

    const isReminder = "options" in interactionOrMessage
        ? interactionOrMessage.options.getString("reminder") === "yes"
        : false;

    if (user?.id) return await userdata(interactionOrMessage, user);

    const msg = await replyAndGetMessage(
        interactionOrMessage,
        { content: t("bitcoin.loading", { e, locale }) },
    );

    if (!msg) return;

    const data = await Database.getUser(author.id);
    const bits = data?.Perfil?.Bits || 0;
    const timeout = data?.Timeouts?.Bitcoin || 0;

    if (Date.timeout(7200000, timeout - 7200000))
        return await msg.edit({
            content: t("bitcoin.farming", {
                e,
                locale,
                timestamp: time(new Date(timeout), "R"),
                bits,
            }),
        });

    return await (bits >= 1000 ? newbitcoin(interactionOrMessage, msg, isReminder) : minebitcoin(interactionOrMessage, msg, author, isReminder));
}