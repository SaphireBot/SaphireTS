import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function dailySequency(
    interactionOrMessage: ChatInputCommandInteraction | Message
) {

    const { userLocale: locale } = interactionOrMessage;
    const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

    const msg = await interactionOrMessage.reply({
        content: t("daily.loading", { e, locale }),
        fetchReply: true
    });

    const data = await Database.getUser(user.id);

    return await msg.edit({ content: t("daily.status", { e, locale, count: data?.DailyCount || 0 }) });

}