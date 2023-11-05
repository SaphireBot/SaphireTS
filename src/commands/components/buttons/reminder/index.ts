import { ButtonInteraction, time } from "discord.js";
import { ReminderButtonDispare } from "../../../../@types/customId";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { ReminderManager } from "../../../../managers";
import modals from "../../../../structures/modals";

export default async function reminder(interaction: ButtonInteraction<"cached">, data: ReminderButtonDispare) {

    const { userLocale: locale, user, message } = interaction;

    if (user.id !== data.uid)
        return await interaction.reply({
            content: t("reminder.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const reminder = await ReminderManager.fetchReminderByMessageId(message.id);

    if (!reminder)
        return await interaction.update({ content: t("reminder.not_found", { e, locale }) });

    if (reminder.deleteAt && (Date.now() >= reminder.deleteAt)) {
        ReminderManager.remove(reminder.id);
        return await interaction.update({ content: t("reminder.expired", { e, locale }) });
    }

    if (data.src === "revalidate")
        return await interaction.showModal(modals.reminderRevalidate(reminder, locale));

    await interaction.update({
        content: t("reminder.finding", { e, locale }),
        components: []
    });

    if (data.src === "delete") {
        ReminderManager.remove(reminder.id);
        return await interaction.editReply({ content: t("reminder.deleted", { e, locale }) });
    }

    if (data.src === "snooze") {
        const snooze = await ReminderManager.snooze(reminder.id);
        if (!snooze)
            return await interaction.editReply({ content: t("reminder.cant_snooze", { e, locale }) });

        return await interaction.editReply({
            content: t("reminder.snooze_success", { e, locale, time: time(new Date(Date.now() + 1000 * 60 * 10), "R") })
        });
    }

    return await interaction.editReply({ content: "#1SD51D5WE51D" });
}