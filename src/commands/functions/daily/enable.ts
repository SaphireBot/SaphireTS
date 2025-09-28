import { ButtonInteraction, ChatInputCommandInteraction, Message, time } from "discord.js";
import Database from "../../../database/index.js";
import { e } from "../../../util/json.js";
import { t } from "../../../translator/index.js";
import { getConfirmationButton } from "../../components/buttons/buttons.get.js";
import { ReminderManager } from "../../../managers/index.js";
import { randomBytes } from "crypto";

export default async function enable_reminder(
    interactionOrMessage: ChatInputCommandInteraction | Message,
    dailyTimeout: number,
    privateOrChannel: string | null,

) {

    const { userLocale: locale } = interactionOrMessage;

    const msg = interactionOrMessage instanceof ChatInputCommandInteraction
        ? await interactionOrMessage.editReply({ content: t("twitch.loading", { e, locale }) })
        : await interactionOrMessage.edit({ content: t("twitch.loading", { e, locale }) });

    const user = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user : interactionOrMessage.author;
    const reminder = await Database.Reminders.findOne({ userId: user.id, message: "reminder.dailyReminder" });
    const commandMention = interactionOrMessage instanceof ChatInputCommandInteraction ? `</daily:${interactionOrMessage.commandId}>` : "`/daily`";

    if (reminder)
        return await msg.edit({
            content: t("daily.reminder_already_setted", {
                e,
                locale,
                commandMention,
                date: Date.toDiscordTime(1000 * 60 * 60 * 24, dailyTimeout, "R"),
            }),
        });

    await msg.edit({
        content: t("daily.enable_timeout", {
            e,
            locale,
            commandMention,
            date: Date.toDiscordTime(1000 * 60 * 60 * 24, dailyTimeout, "R"),
        }),
        components: getConfirmationButton(locale),
    });

    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        time: 1000 * 60 * 5,
        max: 1,
    })
        .on("collect", async (int: ButtonInteraction): Promise<any> => {
            const { customId } = int;
            if (customId === "deny") return collector.stop();
            return revalidateDailyReminder(int);
        })
        .on("end", async (_, reason): Promise<any> => {
            if (["user", "time"].includes(reason)) return await msg.delete();
            if (reason === "limit") return;
            return;
        });

    async function revalidateDailyReminder(int: ButtonInteraction) {

        await int.update({ content: t("reminder.reminder", { e, locale }), components: [] });

        const saved = await ReminderManager.save({
            alerted: false,
            channelId: int.inGuild() ? int.channelId : null,
            createdAt: new Date(),
            guildId: int.inGuild() ? int.guildId : null,
            id: randomBytes(10).toString("base64url"),
            interval: 0,
            isAutomatic: true,
            lauchAt: new Date(Date.now() + ((1000 * 60 * 60 * 24) - (Date.now() - dailyTimeout))),
            message: "reminder.dailyReminder",
            sendToDM: privateOrChannel === "reminderPrivate",
            userId: user.id,
        });

        if (!saved)
            return await int.editReply({ content: t("reminder.fail", { e, locale, error: "??" }) });

        return await int.editReply({
            content: t("reminder.success", {
                e,
                locale,
                message: ` ${t("reminder.of", locale)} \`${t("reminder.dailyReminder", locale)}\` `,
                date: time(new Date(dailyTimeout + (1000 * 60 * 60 * 24)), "R"),
            }),
        });
    }
}