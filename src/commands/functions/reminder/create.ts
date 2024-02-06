import { Message, MessageCollector } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { randomBytes } from "crypto";
import { ReminderType } from "../../../@types/commands";
import { ReminderManager } from "../../../managers";

export default async function createReminder(
    interactionOrMessage: ChatInputCommandInteraction | Message,
    recievedData: {
        message: string
        time: string
        interval: 0 | 1 | 2 | 3
        dm: boolean,
        originalMessage: Message | undefined
    },
    collector?: MessageCollector
) {

    const { userLocale: locale, guild } = interactionOrMessage;
    const { time, interval, dm, originalMessage } = recievedData;
    let message = recievedData?.message;

    if (
        !message || !time
        || typeof message !== "string"
        || message?.length < 1
        || typeof time !== "string"
        || ![0, 1, 2, 3].includes(interval)
    ) {
        collector?.stop();
        if (originalMessage)
            return await originalMessage.edit({ content: t("reminder.invalid_params", { e, locale }) });
        return await interactionOrMessage.reply({ content: t("reminder.invalid_params", { e, locale }), ephemeral: true });
    }

    const timeMs = time.toDateMS();
    const dateNow = Date.now();

    // 5 seconds - 2 years
    if (
        (dateNow + timeMs) <= (dateNow + 4999)
        || timeMs > 63115200000
    ) {
        if (originalMessage)
            return await originalMessage.edit({
                content: `${t("reminder.over_time_except", { e, locale })}` + `\n${t("reminder.awaiting_another_time", { e, locale })}`
            });
        return await interactionOrMessage.reply({
            content: t("reminder.over_time_except", { e, locale }),
            ephemeral: true
        });
    }

    collector?.stop();
    if (originalMessage) await originalMessage.delete().catch(() => { });

    message = message.limit("ReminderMessage");
    const data: ReminderType = {
        id: randomBytes(10).toString("base64url"),
        alerted: false,
        channelId: dm
            ? null
            : interactionOrMessage.inGuild()
                ? interactionOrMessage.channelId
                : null,
        createdAt: new Date(dateNow),
        guildId: dm
            ? null
            : interactionOrMessage.inGuild()
                ? interactionOrMessage.guildId
                : null,
        interval: interactionOrMessage instanceof ChatInputCommandInteraction
            ? interactionOrMessage.options.getInteger("interval") as 1 | 2 | 3 || 0
            : 0,
        isAutomatic: false,
        message: message,
        sendToDM: !guild || dm || !interactionOrMessage.inGuild(),
        lauchAt: new Date(dateNow + timeMs),
        userId: interactionOrMessage instanceof ChatInputCommandInteraction
            ? interactionOrMessage.user.id
            : interactionOrMessage.author.id
    };

    const response: true | { error: any } = await ReminderManager.save(data);

    if (response === true)
        return await interactionOrMessage.reply({
            content: t("reminder.success", {
                e,
                locale,
                message: message.length < 250
                    ? ` ${t("reminder.of", locale)} \`${message}\` `
                    : " ",
                date: data.lauchAt.valueOf() > 86400000
                    ? `${t("reminder.at_day", locale)} ${Date.toDiscordCompleteTime(data.lauchAt)}`
                    : Date.toDiscordCompleteTime(data.lauchAt)
            })
        });

    return await interactionOrMessage.reply({
        content: "error" in response
            ? t("reminder.fail", { e, locale, error: response.error })
            : t("reminder.what", locale)
    });

}