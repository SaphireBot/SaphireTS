import { ButtonInteraction, time } from "discord.js";
import { ReminderButtonDispare } from "../../../../@types/customId";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { ReminderManager } from "../../../../managers";
import modals from "../../../../structures/modals";
import Database from "../../../../database";
import { ReminderViewerCollectors } from "../../../functions/reminder/view";

export default async function reminder(interaction: ButtonInteraction<"cached">, data: ReminderButtonDispare) {

    const { userLocale: locale, user, message } = interaction;

    if (user.id !== data.uid)
        return await interaction.reply({
            content: t("reminder.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const reminder = data.rid
        ? await ReminderManager.fetch(data.rid)
        : await ReminderManager.fetchReminderByMessageId(message.id);

    if (!reminder)
        return await interaction.update({ content: t("reminder.not_found", { e, locale }), embeds: [], components: [] });

    if (reminder.deleteAt && (Date.now() >= reminder.deleteAt.valueOf())) {
        await ReminderManager.remove(reminder.id);
        return await interaction.update({ content: t("reminder.expired", { e, locale }), embeds: [], components: [] });
    }

    if (data.src === "revalidate")
        return await interaction.showModal(modals.reminderRevalidate(reminder, locale));

    message.embeds?.length
        ? await interaction.reply({
            content: t("reminder.finding", { e, locale }),
            ephemeral: true,
            fetchReply: true
        })
        : await interaction.update({
            content: t("reminder.finding", { e, locale }),
            embeds: [],
            components: [],
        });

    if (data.src === "delete") {
        await ReminderManager.remove(reminder.id);
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

    if (data.src === "move") {

        await interaction.editReply({ content: t("reminder.moving", { e, locale }) });
        await ReminderManager.removeFromAllShardsByDatabaseWatch(reminder.id);

        const reminderMoved = await Database.Reminders.findOneAndUpdate(
            { id: reminder.id },
            {
                $set: {
                    channelId: interaction.channelId,
                    guildId: interaction.guildId
                }
            },
            { new: true, upsert: true }
        ).catch(() => null);

        if (!reminderMoved)
            return await interaction.editReply({ content: t("reminder.move_failled", { e, locale }) });

        ReminderManager.start(reminderMoved?.toObject());

        for (const [key, collector] of ReminderViewerCollectors)
            if (
                key.includes(reminderMoved.id)
                || key.includes(reminderMoved.userId!)
            )
                collector.emit("refresh", 1);

        return await interaction.editReply({ content: t("reminder.move_success", { e, locale }) });

    }

    return await interaction.editReply({ content: "#1SD51D5WE51D" });

}