import { ModalSubmitInteraction } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { ReminderManager } from "../../../../managers";
import Database from "../../../../database";
import { ReminderType } from "../../../../@types/commands";

export default async function revalidate(
    interaction: ModalSubmitInteraction<"cached">,
    data: {
        messageId: string
        c: "reminder"
    }
) {

    const { userLocale: locale, message, fields } = interaction;
    const text = fields.getTextInputValue("text");
    const time = fields.getTextInputValue("time")?.limit("ReminderMessage");

    if (
        [
            "cancelar",
            "cancel",
            "stornieren",
            "取消",
            "キャンセルする",
            "annuler",
            "0"
        ].includes(text)
    ) {
        ReminderManager.deleteByMessagesIds([data.messageId]);
        await interaction.reply({
            content: t("reminder.all_cancelled", { e, locale })
        });
        return await message?.edit({ components: [] });
    }

    const timeMs = time.toDateMS();
    const dateNow = Date.now();

    // 5 seconds - 2 years
    if (
        (dateNow + timeMs) <= (dateNow + 4999)
        || timeMs > 63115200000
    )
        return await interaction.reply({
            content: t("reminder.over_time_except", { e, locale }),
            ephemeral: true
        });

    await interaction.reply({ content: t("reminder.loading", { e, locale }), fetchReply: true });
    await message?.edit({ components: [] });

    const reminder = await Database.Reminders.findOneAndUpdate(
        { messageId: data.messageId },
        {
            $set: {
                RemindMessage: text,
                Time: timeMs,
                Alerted: false,
                DateNow: dateNow
            },
            $unset: {
                deleteAt: true,
                messageId: true,
                disableComponents: true
            }
        },
        { new: true }
    )
        .then(doc => doc?.toObject())
        .catch(() => null);

    if (!reminder)
        return await interaction.reply({
            content: t("reminder.not_found", { e, locale }),
            ephemeral: true
        });

    ReminderManager.start(reminder as ReminderType);
    
    return await interaction.editReply({
        content: t("reminder.success", {
            e,
            locale,
            message: text.length < 250
                ? ` ${t("reminder.of", locale)} \`${text}\` `
                : " ",
            date: timeMs > 86400000
                ? `${t("reminder.at_day", locale)} ${Date.toDiscordTime(timeMs + 1000, dateNow, "F")} (${Date.toDiscordTime(timeMs + 1000, dateNow, "R")})`
                : Date.toDiscordTime(timeMs + 1000, dateNow, "R")
        })
    });
}